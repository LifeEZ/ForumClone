from datetime import datetime

from sqlalchemy import Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, utc_now


class Vote(Base):
    __tablename__ = "votes"
    __table_args__ = (UniqueConstraint("user_id", "target_type", "target_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # Cross-service reference to identity user — plain id, NOT a foreign key.
    user_id: Mapped[str] = mapped_column(String(36), nullable=False)
    target_type: Mapped[str] = mapped_column(String(10), nullable=False)  # post | comment
    target_id: Mapped[str] = mapped_column(String(36), nullable=False)
    value: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 or -1
    created_at: Mapped[datetime] = mapped_column(default=utc_now)
