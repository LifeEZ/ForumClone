from datetime import datetime

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, utc_now


class OutboxEvent(Base):
    """A karma delta to be relayed to Identity (ADR-0003).

    One row per vote mutation, written in the same transaction that updates the
    vote row and the target's `score`. The relay polls undispatched rows, POSTs
    them to Identity's /internal/karma, and marks `dispatched_at` on 2xx.
    """

    __tablename__ = "outbox"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    # The user whose karma changes — the post/comment's author_id.
    recipient_user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    delta: Mapped[int] = mapped_column(Integer, nullable=False)
    target_type: Mapped[str] = mapped_column(String(10), nullable=False)  # post | comment
    target_id: Mapped[str] = mapped_column(String(36), nullable=False)
    voter_user_id: Mapped[str] = mapped_column(String(36), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=utc_now, index=True)
    dispatched_at: Mapped[datetime | None] = mapped_column(default=None, index=True)
