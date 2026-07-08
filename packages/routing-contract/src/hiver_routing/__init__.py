"""Single source of truth for the gateway's path-prefix -> service routing table."""

from __future__ import annotations

IDENTITY_PREFIXES: frozenset[str] = frozenset({"auth", "users", ".well-known"})
CONTENT_PREFIXES: frozenset[str] = frozenset(
    {"communities", "posts", "comments", "votes"}
)

SERVICE_PREFIXES: dict[str, frozenset[str]] = {
    "identity": IDENTITY_PREFIXES,
    "content": CONTENT_PREFIXES,
}

__all__ = ["IDENTITY_PREFIXES", "CONTENT_PREFIXES", "SERVICE_PREFIXES"]
