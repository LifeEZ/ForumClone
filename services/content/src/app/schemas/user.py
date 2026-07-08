from datetime import datetime

from pydantic import BaseModel


class AuthorResponse(BaseModel):
    """Public author shape, built from the denormalized snapshot stored on content rows.

    Mirrors identity's UserPublicResponse so the frontend contract is unchanged, but
    the data comes from the snapshot (ADR-0002) — no call into the Identity service.
    Karma is deliberately not snapshotted: it is per-user and changes with every vote,
    so a write-time snapshot would be wrong almost immediately. Karma is shown only on
    the user's own profile (served by Identity), not on posts/comments.
    """

    id: str
    username: str
    display_name: str | None
    bio: str | None
    avatar_url: str | None
    created_at: datetime
