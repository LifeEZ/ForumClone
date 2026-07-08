from datetime import datetime
from typing import TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, utc_now

if TYPE_CHECKING:
    from app.models.post import Post


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    content: Mapped[str] = mapped_column(Text, nullable=False)
    post_id: Mapped[str] = mapped_column(ForeignKey("posts.id"), nullable=False)
    # Cross-service reference to identity user — plain id, NOT a foreign key.
    author_id: Mapped[str] = mapped_column(String(36), nullable=False)
    # Denormalized author snapshot, copied from JWT claims at write time (ADR-0002).
    author_username: Mapped[str] = mapped_column(String(50), nullable=False)
    author_avatar_url: Mapped[str | None] = mapped_column(String(500), default=None)
    parent_id: Mapped[str | None] = mapped_column(ForeignKey("comments.id"), default=None)
    depth: Mapped[int] = mapped_column(Integer, default=0)
    score: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(default=utc_now)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)

    post: Mapped["Post"] = relationship(back_populates="comments")
    parent: Mapped["Comment | None"] = relationship(
        back_populates="replies", remote_side="Comment.id"
    )
    replies: Mapped[list["Comment"]] = relationship(back_populates="parent")
