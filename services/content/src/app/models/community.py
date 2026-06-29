from datetime import datetime
from typing import TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import JSON, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, utc_now

if TYPE_CHECKING:
    from app.models.membership import CommunityMembership
    from app.models.post import Post


class Community(Base):
    __tablename__ = "communities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, default=None)
    rules: Mapped[list | None] = mapped_column(JSON, default=None)
    icon_url: Mapped[str | None] = mapped_column(String(500), default=None)
    banner_url: Mapped[str | None] = mapped_column(String(500), default=None)
    # Cross-service reference to identity user — plain id, NOT a foreign key.
    creator_id: Mapped[str] = mapped_column(String(36), nullable=False)
    member_count: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(default=utc_now)

    memberships: Mapped[list["CommunityMembership"]] = relationship(back_populates="community")
    posts: Mapped[list["Post"]] = relationship(back_populates="community")
