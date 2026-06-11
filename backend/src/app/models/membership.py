from datetime import datetime

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CommunityMembership(Base):
    __tablename__ = "community_memberships"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)
    community_id: Mapped[str] = mapped_column(ForeignKey("communities.id"), primary_key=True)
    role: Mapped[str] = mapped_column(String(20), default="member")
    joined_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="memberships")
    community: Mapped["Community"] = relationship(back_populates="memberships")
