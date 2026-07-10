"""add processed_events for karma idempotency

Identity dedups karma events relayed from Content by event_id (ADR-0003).

Revision ID: 002_processed_events
Revises: 001_initial_auth
Create Date: 2026-07-10

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "002_processed_events"
down_revision: str | None = "001_initial_auth"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "processed_events",
        sa.Column("event_id", sa.String(length=36), nullable=False),
        sa.Column("applied_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("event_id"),
    )


def downgrade() -> None:
    op.drop_table("processed_events")
