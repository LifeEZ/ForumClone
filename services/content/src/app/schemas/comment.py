from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CommentCreate(BaseModel):
    post_id: str
    content: str
    parent_id: str | None = None


class CommentUpdate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    content: str
    post_id: str
    author_id: str
    parent_id: str | None
    depth: int
    score: int
    created_at: datetime
    is_deleted: bool
    user_vote: int | None = None
    replies: list["CommentResponse"] = []
