from dataclasses import dataclass
from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.community import Community
from app.models.membership import CommunityMembership
from app.schemas.community import CommunityCreate


class CommunityNotFoundError(Exception):
    def __init__(self, name: str) -> None:
        self.name = name
        super().__init__(f"Community '{name}' not found")


class CommunityAlreadyExistsError(Exception):
    def __init__(self, name: str) -> None:
        self.name = name
        super().__init__(f"Community '{name}' already exists")


@dataclass(frozen=True)
class CommunityWithCount:
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


async def create_community(
    session: AsyncSession,
    data: CommunityCreate,
    *,
    creator_id: str,
) -> Community:
    community = Community(
        id=str(uuid4()),
        name=data.name,
        display_name=data.display_name,
        description=data.description,
        creator_id=creator_id,
    )
    session.add(community)
    session.add(
        CommunityMembership(
            user_id=creator_id,
            community_id=community.id,
            role="creator",
        )
    )
    try:
        await session.flush()
    except IntegrityError as exc:
        await session.rollback()
        raise CommunityAlreadyExistsError(data.name) from exc
    return community
