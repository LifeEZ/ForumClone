from datetime import datetime
from typing import TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, utc_now

if TYPE_CHECKING:
    from app.models.comment import Comment
    from app.models.community import Community


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    content: Mapped[str | None] = mapped_column(Text, default=None)
    url: Mapped[str | None] = mapped_column(String(2000), default=None)
    media_url: Mapped[str | None] = mapped_column(String(500), default=None)
    post_type: Mapped[str] = mapped_column(String(10), default="text")  # text | link | image
    community_id: Mapped[str] = mapped_column(ForeignKey("communities.id"), nullable=False)
    # Cross-service reference to identity user — plain id, NOT a foreign key.
    author_id: Mapped[str] = mapped_column(String(36), nullable=False)
    # Denormalized author snapshot, copied from JWT claims at write time (ADR-0002).
    author_username: Mapped[str] = mapped_column(String(50), nullable=False)
    author_avatar_url: Mapped[str | None] = mapped_column(String(500), default=None)
    author_karma: Mapped[int] = mapped_column(Integer, default=0)
    score: Mapped[int] = mapped_column(Integer, default=0)
    comment_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(default=utc_now)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False)

    community: Mapped["Community"] = relationship(back_populates="posts")
    comments: Mapped[list["Comment"]] = relationship(back_populates="post")
