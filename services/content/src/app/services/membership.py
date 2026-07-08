from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser
from app.models.community import Community
from app.models.membership import CommunityMembership
from app.models.post import Post
from app.services.community import get_community_by_name


class AlreadyMemberError(Exception):
    def __init__(self, community_name: str) -> None:
        self.community_name = community_name
        super().__init__(f"Already a member of '{community_name}'")


class NotMemberError(Exception):
    def __init__(self, community_name: str) -> None:
        self.community_name = community_name
        super().__init__(f"Not a member of '{community_name}'")


async def is_member(session: AsyncSession, user_id: str, community_id: str) -> bool:
    result = await session.execute(
        select(CommunityMembership.user_id).where(
            CommunityMembership.user_id == user_id,
            CommunityMembership.community_id == community_id,
        )
    )
    return result.scalar_one_or_none() is not None


async def count_members(session: AsyncSession, community_id: str) -> int:
    """Live member count for one community — the number of membership rows.

    `member_count` is no longer a stored column; it is derived from the rows so it can
    never drift from them (Candidate D). This is the one place that knows the count is
    `COUNT(community_memberships)`.
    """
    result = await session.execute(
        select(func.count())
        .select_from(CommunityMembership)
        .where(CommunityMembership.community_id == community_id)
    )
    return int(result.scalar_one())


async def count_members_for(session: AsyncSession, community_ids: list[str]) -> dict[str, int]:
    """Batched live member counts — one query for many communities (no N+1 on lists)."""
    if not community_ids:
        return {}
    result = await session.execute(
        select(CommunityMembership.community_id, func.count())
        .where(CommunityMembership.community_id.in_(community_ids))
        .group_by(CommunityMembership.community_id)
    )
    return {str(cid): int(cnt) for cid, cnt in result.all()}


async def join_community(session: AsyncSession, name: str, user: CurrentUser) -> Community:
    community = await get_community_by_name(session, name)
    if await is_member(session, user.id, community.id):
        raise AlreadyMemberError(name)

    session.add(
        CommunityMembership(
            user_id=user.id,
            community_id=community.id,
            role="member",
        )
    )
    try:
        await session.flush()
    except IntegrityError as exc:
        await session.rollback()
        raise AlreadyMemberError(name) from exc

    return community


async def leave_community(session: AsyncSession, name: str, user: CurrentUser) -> Community:
    community = await get_community_by_name(session, name)
    if not await is_member(session, user.id, community.id):
        raise NotMemberError(name)

    await session.execute(
        delete(CommunityMembership).where(
            CommunityMembership.user_id == user.id,
            CommunityMembership.community_id == community.id,
        )
    )
    await session.flush()
    return community


async def list_joined_communities(session: AsyncSession, user_id: str) -> list[Community]:
    result = await session.execute(
        select(Community)
        .join(CommunityMembership, CommunityMembership.community_id == Community.id)
        .where(CommunityMembership.user_id == user_id)
        .order_by(Community.display_name)
    )
    return list(result.scalars().all())


async def list_home_posts(
    session: AsyncSession,
    user_id: str,
    *,
    offset: int = 0,
    limit: int = 20,
) -> list[Post]:
    joined_ids = select(CommunityMembership.community_id).where(
        CommunityMembership.user_id == user_id
    )
    result = await session.execute(
        select(Post)
        .where(Post.is_deleted.is_(False), Post.community_id.in_(joined_ids))
        .order_by(Post.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return list(result.scalars().all())
