"""add outbox table for karma events

Content writes one outbox row per vote mutation (same txn as the vote + score
update). A relay polls undispatched rows and POSTs them to Identity's
/internal/karma, marking dispatched_at on 2xx. See ADR-0003.

Revision ID: 004_outbox
Revises: 003_drop_member_count
Create Date: 2026-07-10

"""

import sqlalchemy as sa
from alembic import op

revision = "004_outbox"
down_revision = "003_drop_member_count"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "outbox",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("recipient_user_id", sa.String(length=36), nullable=False),
        sa.Column("delta", sa.Integer(), nullable=False),
        sa.Column("target_type", sa.String(length=10), nullable=False),
        sa.Column("target_id", sa.String(length=36), nullable=False),
        sa.Column("voter_user_id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("dispatched_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_outbox_recipient_user_id", "outbox", ["recipient_user_id"])
    op.create_index("ix_outbox_created_at", "outbox", ["created_at"])
    op.create_index("ix_outbox_dispatched_at", "outbox", ["dispatched_at"])


def downgrade() -> None:
    op.drop_index("ix_outbox_dispatched_at", table_name="outbox")
    op.drop_index("ix_outbox_created_at", table_name="outbox")
    op.drop_index("ix_outbox_recipient_user_id", table_name="outbox")
    op.drop_table("outbox")
