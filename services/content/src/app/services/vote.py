from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser
from app.models.comment import Comment
from app.models.outbox import OutboxEvent
from app.models.post import Post
from app.models.vote import Vote
from app.schemas.vote import VoteRequest, VoteResponse

POST = "post"
COMMENT = "comment"


class TargetNotFoundError(Exception):
    def __init__(self, target_type: str, target_id: str) -> None:
        self.target_type = target_type
        self.target_id = target_id
        super().__init__(f"{target_type} '{target_id}' not found")


class SelfVoteError(Exception):
    def __init__(self, target_type: str, target_id: str) -> None:
        self.target_type = target_type
        self.target_id = target_id
        super().__init__(f"Cannot vote on own {target_type}")


async def _load_target(session: AsyncSession, target_type: str, target_id: str) -> Post | Comment:
    if target_type == POST:
        result = await session.execute(
            select(Post).where(Post.id == target_id, Post.is_deleted.is_(False))
        )
        target = result.scalar_one_or_none()
    else:
        result = await session.execute(
            select(Comment).where(Comment.id == target_id, Comment.is_deleted.is_(False))
        )
        target = result.scalar_one_or_none()
    if target is None:
        raise TargetNotFoundError(target_type, target_id)
    return target


async def cast_vote(
    session: AsyncSession,
    data: VoteRequest,
    *,
    voter: CurrentUser,
) -> VoteResponse:
    """Apply a vote mutation and write the karma outbox event in one txn.

    `value` is -1, 0, or 1. 0 means remove the vote. The target's `score` moves
    by `new - old`; a corresponding outbox row carries that delta to the target's
    author via the relay (ADR-0003).
    """
    target = await _load_target(session, data.target_type, data.target_id)
    if target.author_id == voter.id:
        raise SelfVoteError(data.target_type, data.target_id)

    result = await session.execute(
        select(Vote).where(
            Vote.user_id == voter.id,
            Vote.target_type == data.target_type,
            Vote.target_id == data.target_id,
        )
    )
    existing = result.scalar_one_or_none()
    old_value = existing.value if existing is not None else 0
    new_value = data.value
    delta = new_value - old_value

    if existing is None:
        if new_value != 0:
            session.add(
                Vote(
                    user_id=voter.id,
                    target_type=data.target_type,
                    target_id=data.target_id,
                    value=new_value,
                )
            )
    elif new_value == 0:
        await session.delete(existing)
    elif new_value != old_value:
        existing.value = new_value
    # else: no-op (re-sending the same value)

    if delta != 0:
        target.score += delta
        session.add(
            OutboxEvent(
                id=str(uuid4()),
                recipient_user_id=target.author_id,
                delta=delta,
                target_type=data.target_type,
                target_id=data.target_id,
                voter_user_id=voter.id,
            )
        )

    await session.flush()
    return VoteResponse(target_type=data.target_type, target_id=data.target_id, value=new_value)


async def get_user_votes(
    session: AsyncSession,
    user_id: str,
    target_type: str,
    target_ids: list[str],
) -> dict[str, int]:
    """Batch-load the viewer's vote values for one target type."""
    if not target_ids:
        return {}
    result = await session.execute(
        select(Vote.target_id, Vote.value).where(
            Vote.user_id == user_id,
            Vote.target_type == target_type,
            Vote.target_id.in_(target_ids),
        )
    )
    return {str(target_id): int(value) for target_id, value in result.all()}
