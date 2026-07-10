from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.datetime import UtcDatetime
from app.schemas.user import AuthorResponse

if TYPE_CHECKING:
    from app.models.comment import Comment

COMMENT_CONTENT_MAX_LENGTH = 40_000


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=COMMENT_CONTENT_MAX_LENGTH)
    parent_id: str | None = None

    @field_validator("content")
    @classmethod
    def _validate_content(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("content must not be empty")
        return stripped


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    content: str
    post_id: str
    author: AuthorResponse
    parent_id: str | None
    depth: int
    score: int
    created_at: UtcDatetime
    is_deleted: bool
    user_vote: int | None = None
    replies: list["CommentResponse"] = []

    @classmethod
    def from_comment(
        cls,
        comment: "Comment",
        *,
        user_vote: int = 0,
        replies: list["CommentResponse"] | None = None,
    ) -> "CommentResponse":
        author = AuthorResponse(
            id=comment.author_id,
            username=comment.author_username,
            display_name=comment.author_username,
            bio=None,
            avatar_url=comment.author_avatar_url,
            created_at=comment.created_at,
        )
        return cls(
            id=comment.id,
            content=comment.content,
            post_id=comment.post_id,
            author=author,
            parent_id=comment.parent_id,
            depth=comment.depth,
            score=comment.score,
            created_at=comment.created_at,
            is_deleted=comment.is_deleted,
            user_vote=user_vote,
            replies=replies or [],
        )
