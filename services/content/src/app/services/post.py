from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser
from app.models.post import Post
from app.schemas.post import PostCreate
from app.services.community import get_community_by_name
from app.services.membership import is_member


class PostNotFoundError(Exception):
    def __init__(self, post_id: str) -> None:
        self.post_id = post_id
        super().__init__(f"Post '{post_id}' not found")


class MembershipRequiredError(Exception):
    def __init__(self, name: str) -> None:
        self.name = name
        super().__init__(f"Membership required to post in '{name}'")


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


async def create_post(
    session: AsyncSession,
    name: str,
    data: PostCreate,
    *,
    author: CurrentUser,
) -> Post:
    community = await get_community_by_name(session, name)
    if not await is_member(session, author.id, community.id):
        raise MembershipRequiredError(name)

    post = Post(
        title=data.title,
        content=data.content,
        post_type="text",
        community_id=community.id,
        author_id=author.id,
        author_username=author.username,
        author_avatar_url=author.avatar_url,
    )
    session.add(post)
    await session.flush()
    return post
