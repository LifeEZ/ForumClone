from datetime import datetime

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, utc_now


class ProcessedEvent(Base):
    """Idempotency gate for karma events relayed from Content (ADR-0003).

    Inserting a row here is the apply gate: if the event_id already exists, the
    delta has already been applied and the relay's POST is treated as a success.
    """

    __tablename__ = "processed_events"

    event_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    applied_at: Mapped[datetime] = mapped_column(default=utc_now)
