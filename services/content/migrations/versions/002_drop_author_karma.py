"""drop author_karma from posts and comments

The author snapshot is `author_username` + `author_avatar_url` only (ADR-0002).
`author_karma` was never documented in the ADR/PLAN and has no write-side source
on the Content side (the access token carries no karma claim, and Content makes
no live call to Identity). Karma is per-user and changes with every vote, so a
write-time snapshot would be wrong almost immediately; it is shown only on the
user's own profile, served by Identity. Drop the column from both content rows.

Revision ID: 002_drop_author_karma
Revises: 001_content
Create Date: 2026-06-29

"""

from alembic import op

revision = "002_drop_author_karma"
down_revision = "001_content"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("posts", "author_karma")
    op.drop_column("comments", "author_karma")


def downgrade() -> None:
    import sqlalchemy as sa

    op.add_column("comments", sa.Column("author_karma", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("posts", sa.Column("author_karma", sa.Integer(), nullable=False, server_default="0"))
