"""Outbox→Identity karma relay (ADR-0003).

Polls the outbox table for undispatched karma events and POSTs them to Identity's
``/internal/karma`` endpoint with the shared internal secret, marking
``dispatched_at`` on a 2xx response. At-least-once; Identity dedups by event_id.

Runs as an asyncio background task in Content's lifespan. ``drain_outbox`` is one
poll→post→mark pass, exposed for tests so they can drive a single cycle without
the loop.
"""

from __future__ import annotations

import asyncio
import contextlib
import logging
from collections.abc import Awaitable, Callable

import httpx
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.database import utc_now
from app.models.outbox import OutboxEvent

logger = logging.getLogger(__name__)

INTERNAL_TOKEN_HEADER = "X-Hiver-Internal-Token"
KARMA_PATH = "/internal/karma"


async def drain_outbox(
    session_factory: async_sessionmaker[AsyncSession],
    *,
    identity_url: str,
    internal_token: str,
    batch_size: int,
    client: httpx.AsyncClient | None = None,
) -> int:
    """Drain one batch of undispatched outbox events. Returns the count dispatched."""
    if client is None:
        client = httpx.AsyncClient(timeout=5.0)
        own_client = True
    else:
        own_client = False

    dispatched = 0
    try:
        async with session_factory() as session:
            result = await session.execute(
                select(OutboxEvent)
                .where(OutboxEvent.dispatched_at.is_(None))
                .order_by(OutboxEvent.created_at.asc(), OutboxEvent.id.asc())
                .limit(batch_size)
            )
            events = list(result.scalars().all())
            if not events:
                return 0

            dispatched_ids: list[str] = []
            for event in events:
                payload = {
                    "event_id": event.id,
                    "recipient_user_id": event.recipient_user_id,
                    "delta": event.delta,
                    "target_type": event.target_type,
                    "target_id": event.target_id,
                    "voter_user_id": event.voter_user_id,
                }
                headers = {INTERNAL_TOKEN_HEADER: internal_token}
                try:
                    resp = await client.post(
                        f"{identity_url}{KARMA_PATH}", json=payload, headers=headers
                    )
                except httpx.HTTPError as exc:
                    logger.warning("karma relay: post failed for %s: %s", event.id, exc)
                    continue
                if 200 <= resp.status_code < 300:
                    dispatched_ids.append(event.id)
                    dispatched += 1
                else:
                    logger.warning(
                        "karma relay: identity returned %s for %s", resp.status_code, event.id
                    )

            if dispatched_ids:
                await session.execute(
                    update(OutboxEvent)
                    .where(OutboxEvent.id.in_(dispatched_ids))
                    .values(dispatched_at=utc_now())
                )
                await session.commit()
    finally:
        if own_client:
            await client.aclose()

    return dispatched


async def run_relay_loop(
    session_factory: async_sessionmaker[AsyncSession],
    *,
    identity_url: str,
    internal_token: str,
    interval_seconds: float,
    batch_size: int,
    stop_event: asyncio.Event,
) -> None:
    """Loop until ``stop_event`` is set. Used by the lifespan background task."""
    async with httpx.AsyncClient(timeout=5.0) as client:
        while not stop_event.is_set():
            try:
                await drain_outbox(
                    session_factory,
                    identity_url=identity_url,
                    internal_token=internal_token,
                    batch_size=batch_size,
                    client=client,
                )
            except Exception:  # noqa: BLE001 — relay must not die on a cycle error
                logger.exception("karma relay: drain cycle failed")
            with contextlib.suppress(TimeoutError):
                await asyncio.wait_for(stop_event.wait(), timeout=interval_seconds)


def start_relay(
    session_factory: async_sessionmaker[AsyncSession],
    *,
    identity_url: str,
    internal_token: str,
    interval_seconds: float,
    batch_size: int,
) -> Callable[[], Awaitable[None]]:
    """Return a stop callback. The caller starts the task; calling the returned
    callback signals the loop to stop (does not await it — the lifespan cancels)."""
    stop_event = asyncio.Event()
    task = asyncio.create_task(
        run_relay_loop(
            session_factory,
            identity_url=identity_url,
            internal_token=internal_token,
            interval_seconds=interval_seconds,
            batch_size=batch_size,
            stop_event=stop_event,
        )
    )

    async def stop() -> None:
        stop_event.set()
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task

    return stop
