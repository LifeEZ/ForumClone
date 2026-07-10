from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.processed_event import ProcessedEvent
from app.models.user import User


async def apply_karma_delta(
    session: AsyncSession,
    *,
    event_id: str,
    recipient_user_id: str,
    delta: int,
) -> bool:
    """Apply a karma delta with event_id idempotency (ADR-0003).

    Returns True if the delta was applied this call, False if it was already
    applied on a previous call (duplicate event). Either way the caller treats
    the request as a success.
    """
    try:
        session.add(ProcessedEvent(event_id=event_id))
        await session.flush()
    except IntegrityError:
        # event_id already present — already applied. Roll back the insert only.
        await session.rollback()
        return False

    result = await session.execute(select(User).where(User.id == recipient_user_id))
    user = result.scalar_one_or_none()
    if user is None:
        # Recipient doesn't exist (shouldn't happen — author_id is always a real
        # user). Keep the processed_events row so the relay doesn't retry forever;
        # the delta is dropped. Better than an infinite retry loop.
        return False

    user.karma += delta
    await session.flush()
    return True
