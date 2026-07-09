"""drop member_count from communities

member_count is now derived from COUNT(community_memberships) at read time, so the
hand-maintained counter and its +1/-1 updates on join/leave are gone.

Revision ID: 003_drop_member_count
Revises: 002_drop_author_karma
Create Date: 2026-07-08

"""

import sqlalchemy as sa
from alembic import op

revision = "003_drop_member_count"
down_revision = "002_drop_author_karma"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("communities", "member_count")


def downgrade() -> None:
    op.add_column(
        "communities",
        sa.Column("member_count", sa.Integer(), nullable=False, server_default="1"),
    )
