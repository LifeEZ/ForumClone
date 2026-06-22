from datetime import datetime
from typing import TYPE_CHECKING, Literal

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserPublicResponse

if TYPE_CHECKING:
    from app.models.post import Post


def score_to_vote_counts(score: int) -> tuple[int, int]:
    if score >= 0:
        return score, 0
    return 0, -score


class PostCreate(BaseModel):
    title: str
    community_id: str
    post_type: Literal["text", "link", "image"] = "text"
    content: str | None = None
    url: str | None = None


class PostUpdate(BaseModel):
    title: str | None = None
    content: str | None = None


class PostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    content: str | None
    url: str | None
    media_url: str | None
    post_type: str
    community_id: str
    author_id: str
    score: int
    comment_count: int
    created_at: datetime
    is_deleted: bool
    is_locked: bool
    user_vote: int | None = None  # populated by service when user is authenticated


class PostFeedItem(BaseModel):
    id: str
    title: str
    content: str | None
    community_id: str
    author: UserPublicResponse
    score: int
    upvotes: int
    downvotes: int
    user_vote: int = 0
    comment_count: int
    created_at: datetime
    is_deleted: bool

    @classmethod
    def from_post(cls, post: "Post", *, user_vote: int = 0) -> "PostFeedItem":
        upvotes, downvotes = score_to_vote_counts(post.score)
        return cls(
            id=post.id,
            title=post.title,
            content=post.content,
            community_id=post.community_id,
            author=UserPublicResponse.model_validate(post.author),
            score=post.score,
            upvotes=upvotes,
            downvotes=downvotes,
            user_vote=user_vote,
            comment_count=post.comment_count,
            created_at=post.created_at,
            is_deleted=post.is_deleted,
        )
