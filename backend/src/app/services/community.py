from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.community import Community


class CommunityNotFoundError(Exception):
    def __init__(self, name: str) -> None:
        self.name = name
        super().__init__(f"Community '{name}' not found")


async def list_communities(
    session: AsyncSession,
    *,
    offset: int = 0,
    limit: int = 50,
) -> list[Community]:
    result = await session.execute(
        select(Community)
        .order_by(Community.member_count.desc(), Community.name)
        .offset(offset)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_community_by_name(session: AsyncSession, name: str) -> Community:
    result = await session.execute(select(Community).where(Community.name == name))
    community = result.scalar_one_or_none()
    if community is None:
        raise CommunityNotFoundError(name)
    return community
