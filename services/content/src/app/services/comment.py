from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser
from app.models.comment import Comment
from app.models.post import Post
from app.schemas.comment import CommentCreate, CommentResponse

MAX_COMMENT_DEPTH = 10


class ParentCommentNotFoundError(Exception):
    def __init__(self, parent_id: str) -> None:
        self.parent_id = parent_id
        super().__init__(f"Parent comment '{parent_id}' not found")


class CommentParentMismatchError(Exception):
    def __init__(self, parent_id: str, post_id: str) -> None:
        self.parent_id = parent_id
        self.post_id = post_id
        super().__init__(f"Parent comment '{parent_id}' does not belong to post '{post_id}'")


class MaxCommentDepthError(Exception):
    def __init__(self, parent_id: str, depth: int) -> None:
        self.parent_id = parent_id
        self.depth = depth
        super().__init__(
            f"Cannot reply to comment '{parent_id}' at depth {depth} (max {MAX_COMMENT_DEPTH})"
        )


async def list_comments_for_post(
    session: AsyncSession,
    post_id: str,
) -> list[CommentResponse]:
    """Return the comment tree for a post.

    Top-level comments are newest-first; replies within a thread are oldest-first
    so a discussion reads top-to-bottom. Built in two queries + in-memory assembly.
    """
    result = await session.execute(
        select(Comment)
        .where(Comment.post_id == post_id)
        .order_by(Comment.created_at.asc(), Comment.id.asc())
    )
    rows = list(result.scalars().all())

    by_id: dict[str, CommentResponse] = {}
    top_level: list[CommentResponse] = []
    children_by_parent: dict[str, list[Comment]] = {}

    for row in rows:
        if row.parent_id is None:
            top_level.append(CommentResponse.from_comment(row))
            by_id[row.id] = top_level[-1]
        else:
            children_by_parent.setdefault(row.parent_id, []).append(row)

    # Attach replies depth-first. Children were collected in created_at asc order,
    # so each parent's replies end up oldest-first.
    def attach(parent: CommentResponse) -> None:
        replies = [
            CommentResponse.from_comment(child) for child in children_by_parent.get(parent.id, [])
        ]
        for reply in replies:
            by_id[reply.id] = reply
            attach(reply)
        parent.replies = replies

    for root in top_level:
        attach(root)

    top_level.sort(key=lambda c: c.created_at, reverse=True)
    return top_level


async def create_comment(
    session: AsyncSession,
    post: Post,
    data: CommentCreate,
    *,
    author: CurrentUser,
) -> Comment:
    if data.parent_id is not None:
        parent = await session.get(Comment, data.parent_id)
        if parent is None:
            raise ParentCommentNotFoundError(data.parent_id)
        if parent.post_id != post.id:
            raise CommentParentMismatchError(data.parent_id, post.id)
        if parent.depth >= MAX_COMMENT_DEPTH:
            raise MaxCommentDepthError(data.parent_id, parent.depth)
        depth = parent.depth + 1
    else:
        depth = 0

    comment = Comment(
        content=data.content,
        post_id=post.id,
        author_id=author.id,
        author_username=author.username,
        author_avatar_url=author.avatar_url,
        parent_id=data.parent_id,
        depth=depth,
    )
    session.add(comment)
    post.comment_count += 1
    await session.flush()
    return comment
