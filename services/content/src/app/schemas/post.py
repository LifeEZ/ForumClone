from datetime import datetime
from typing import TYPE_CHECKING, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.user import AuthorResponse

if TYPE_CHECKING:
    from app.models.post import Post

POST_TITLE_MAX_LENGTH = 300
POST_CONTENT_MAX_LENGTH = 40_000


def score_to_vote_counts(score: int) -> tuple[int, int]:
    if score >= 0:
        return score, 0
    return 0, -score


class PostCreate(BaseModel):
    title: str = Field(min_length=1, max_length=POST_TITLE_MAX_LENGTH)
    post_type: Literal["text", "link", "image"] = "text"
    content: str | None = Field(default=None, max_length=POST_CONTENT_MAX_LENGTH)
    url: str | None = None

    @field_validator("title")
    @classmethod
    def _validate_title(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("title must not be empty")
        return stripped

    @model_validator(mode="after")
    def _text_only_in_v1(self) -> "PostCreate":
        # Link/image posts are deferred to v2. The schema shape stays broad so v2
        # only needs to drop this guard.
        if self.post_type != "text":
            raise ValueError("only text posts are supported in v1")
        if self.url is not None:
            raise ValueError("url is not supported for text posts in v1")
        return self


class PostUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=POST_TITLE_MAX_LENGTH)
    content: str | None = None

    @field_validator("title")
    @classmethod
    def _validate_title(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        if not stripped:
            raise ValueError("title must not be empty")
        return stripped


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
    user_vote: int | None = None


class PostFeedItem(BaseModel):
    id: str
    title: str
    content: str | None
    community_id: str
    author: AuthorResponse
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
        author = AuthorResponse(
            id=post.author_id,
            username=post.author_username,
            display_name=post.author_username,
            bio=None,
            avatar_url=post.author_avatar_url,
            created_at=post.created_at,
        )
        return cls(
            id=post.id,
            title=post.title,
            content=post.content,
            community_id=post.community_id,
            author=author,
            score=post.score,
            upvotes=upvotes,
            downvotes=downvotes,
            user_vote=user_vote,
            comment_count=post.comment_count,
            created_at=post.created_at,
            is_deleted=post.is_deleted,
        )
