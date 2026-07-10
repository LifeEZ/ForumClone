import httpx
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

import app.models.outbox  # noqa: F401  (register for Base.metadata)
from app.database import Base
from app.karma_relay import INTERNAL_TOKEN_HEADER, drain_outbox
from app.models.outbox import OutboxEvent

pytestmark = pytest.mark.anyio


async def _make_factory():
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    return engine, factory


async def test_drain_outbox_posts_and_marks_dispatched() -> None:
    engine, factory = await _make_factory()
    try:
        async with factory() as sess:
            sess.add(
                OutboxEvent(
                    id="e-1",
                    recipient_user_id="u-recipient",
                    delta=2,
                    target_type="post",
                    target_id="p-1",
                    voter_user_id="u-voter",
                )
            )
            await sess.commit()

        received: list[httpx.Request] = []

        def handler(request: httpx.Request) -> httpx.Response:
            received.append(request)
            return httpx.Response(200, json={"event_id": "e-1", "applied": True})

        client = httpx.AsyncClient(transport=httpx.MockTransport(handler))

        dispatched = await drain_outbox(
            factory,
            identity_url="http://identity.test",
            internal_token="secret",
            batch_size=10,
            client=client,
        )
        await client.aclose()

        assert dispatched == 1
        assert len(received) == 1
        request = received[0]
        assert request.url == "http://identity.test/internal/karma"
        assert request.headers[INTERNAL_TOKEN_HEADER] == "secret"

        async with factory() as sess:
            row = (
                await sess.execute(select(OutboxEvent).where(OutboxEvent.id == "e-1"))
            ).scalar_one()
            assert row.dispatched_at is not None
    finally:
        await engine.dispose()


async def test_drain_outbox_does_not_mark_on_5xx() -> None:
    engine, factory = await _make_factory()
    try:
        async with factory() as sess:
            sess.add(
                OutboxEvent(
                    id="e-5xx",
                    recipient_user_id="u-recipient",
                    delta=1,
                    target_type="post",
                    target_id="p-1",
                    voter_user_id="u-voter",
                )
            )
            await sess.commit()

        client = httpx.AsyncClient(transport=httpx.MockTransport(lambda r: httpx.Response(500)))

        dispatched = await drain_outbox(
            factory,
            identity_url="http://identity.test",
            internal_token="secret",
            batch_size=10,
            client=client,
        )
        await client.aclose()

        assert dispatched == 0
        async with factory() as sess:
            row = (
                await sess.execute(select(OutboxEvent).where(OutboxEvent.id == "e-5xx"))
            ).scalar_one()
            assert row.dispatched_at is None
    finally:
        await engine.dispose()


async def test_drain_outbox_empty_is_noop() -> None:
    engine, factory = await _make_factory()
    try:
        client = httpx.AsyncClient(transport=httpx.MockTransport(lambda r: httpx.Response(200)))
        dispatched = await drain_outbox(
            factory,
            identity_url="http://identity.test",
            internal_token="secret",
            batch_size=10,
            client=client,
        )
        await client.aclose()
        assert dispatched == 0
    finally:
        await engine.dispose()
