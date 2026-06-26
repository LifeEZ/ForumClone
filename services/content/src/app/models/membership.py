from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, utc_now

if TYPE_CHECKING:
    from app.models.community import Community


class CommunityMembership(Base):
    __tablename__ = "community_memberships"

    # Cross-service reference to identity user — plain id, NOT a foreign key.
    user_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    community_id: Mapped[str] = mapped_column(ForeignKey("communities.id"), primary_key=True)
    role: Mapped[str] = mapped_column(String(20), default="member")
    joined_at: Mapped[datetime] = mapped_column(default=utc_now)

    community: Mapped["Community"] = relationship(back_populates="memberships")
