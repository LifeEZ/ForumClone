"""content tables — communities, posts, comments, votes, memberships

No foreign keys into the users table: users live in the Identity service's
database. Cross-service user references are plain string columns, and posts/
comments carry a denormalized author snapshot (ADR-0002).

Revision ID: 001_content
Revises:
Create Date: 2026-06-26

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "001_content"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "communities",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("display_name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("rules", sa.JSON(), nullable=True),
        sa.Column("icon_url", sa.String(length=500), nullable=True),
        sa.Column("banner_url", sa.String(length=500), nullable=True),
        sa.Column("creator_id", sa.String(length=36), nullable=False),
        sa.Column("member_count", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_table(
        "posts",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("url", sa.String(length=2000), nullable=True),
        sa.Column("media_url", sa.String(length=500), nullable=True),
        sa.Column("post_type", sa.String(length=10), nullable=False, server_default="text"),
        sa.Column("community_id", sa.String(length=36), nullable=False),
        sa.Column("author_id", sa.String(length=36), nullable=False),
        sa.Column("author_username", sa.String(length=50), nullable=False),
        sa.Column("author_avatar_url", sa.String(length=500), nullable=True),
        sa.Column("author_karma", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("comment_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_locked", sa.Boolean(), nullable=False, server_default="false"),
        sa.ForeignKeyConstraint(["community_id"], ["communities.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "comments",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("post_id", sa.String(length=36), nullable=False),
        sa.Column("author_id", sa.String(length=36), nullable=False),
        sa.Column("author_username", sa.String(length=50), nullable=False),
        sa.Column("author_avatar_url", sa.String(length=500), nullable=True),
        sa.Column("author_karma", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("parent_id", sa.String(length=36), nullable=True),
        sa.Column("depth", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default="false"),
        sa.ForeignKeyConstraint(["parent_id"], ["comments.id"]),
        sa.ForeignKeyConstraint(["post_id"], ["posts.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "votes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("target_type", sa.String(length=10), nullable=False),
        sa.Column("target_id", sa.String(length=36), nullable=False),
        sa.Column("value", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "target_type", "target_id"),
    )
    op.create_table(
        "community_memberships",
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("community_id", sa.String(length=36), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False, server_default="member"),
        sa.Column("joined_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["community_id"], ["communities.id"]),
        sa.PrimaryKeyConstraint("user_id", "community_id"),
    )


def downgrade() -> None:
    op.drop_table("community_memberships")
    op.drop_table("votes")
    op.drop_table("comments")
    op.drop_table("posts")
    op.drop_table("communities")
