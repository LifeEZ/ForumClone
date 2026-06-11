from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


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
