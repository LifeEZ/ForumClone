from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.community import Community
from app.models.membership import CommunityMembership


class CommunityNotFoundError(Exception):
    def __init__(self, name: str) -> None:
        self.name = name
        super().__init__(f"Community '{name}' not found")


@dataclass(frozen=True)
class CommunityWithCount:
    """A community paired with its live member count (Candidate D).

    `list_communities` orders by popularity, so it needs the count in the same query —
    this pairs the row with its `COUNT(community_memberships)` from a single aggregate
    instead of a stored column.
    """

    community: Community
    member_count: int


async def list_communities(
    session: AsyncSession,
    *,
    offset: int = 0,
    limit: int = 50,
) -> list[CommunityWithCount]:
    member_count = func.count(CommunityMembership.user_id).label("member_count")
    result = await session.execute(
        select(Community, member_count)
        .outerjoin(
            CommunityMembership,
            CommunityMembership.community_id == Community.id,
        )
        .group_by(Community.id)
        .order_by(member_count.desc(), Community.name)
        .offset(offset)
        .limit(limit)
    )
    return [
        CommunityWithCount(community=community, member_count=int(count))
        for community, count in result.all()
    ]


async def get_community_by_name(session: AsyncSession, name: str) -> Community:
    result = await session.execute(select(Community).where(Community.name == name))
    community = result.scalar_one_or_none()
    if community is None:
        raise CommunityNotFoundError(name)
    return community
