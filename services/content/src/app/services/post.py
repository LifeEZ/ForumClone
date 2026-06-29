from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.post import Post


class PostNotFoundError(Exception):
    def __init__(self, post_id: str) -> None:
        self.post_id = post_id
        super().__init__(f"Post '{post_id}' not found")


async def list_posts(
    session: AsyncSession,
    *,
    community_id: str | None = None,
    offset: int = 0,
    limit: int = 20,
) -> list[Post]:
    query = (
        select(Post)
        .where(Post.is_deleted.is_(False))
        .order_by(Post.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    if community_id is not None:
        query = query.where(Post.community_id == community_id)
    result = await session.execute(query)
    return list(result.scalars().all())


async def get_post(session: AsyncSession, post_id: str) -> Post:
    result = await session.execute(
        select(Post).where(Post.id == post_id, Post.is_deleted.is_(False))
    )
    post = result.scalar_one_or_none()
    if post is None:
        raise PostNotFoundError(post_id)
    return post
