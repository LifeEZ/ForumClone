"""Shared access-token contract for Hiver services.

One source of truth for the claim names, token type, algorithm, and the
`TokenInvalidError` raised by every verifier. Identity signs tokens against this
contract; Content and the Gateway verify against it. Keeping the contract in a
dependency-free package means adding or changing a claim is a one-file edit
consumed by all three services (ADR-0002).

This package owns only the *contract* — the shape of what an access token claims
and the shared validation of that shape. It does not own the verifiers: each
service keeps its own, because they genuinely differ.
"""

from __future__ import annotations

from dataclasses import dataclass

ALGORITHM = "RS256"
ACCESS_TOKEN_TYPE = "access"


CLAIM_SUB = "sub"
CLAIM_USERNAME = "username"
CLAIM_AVATAR_URL = "avatar_url"
CLAIM_TYPE = "type"


class TokenInvalidError(Exception):
    """Raised by every service when an access token is missing, malformed, or expired."""


@dataclass(frozen=True)
class AccessClaims:
    sub: str
    username: str
    avatar_url: str | None


def claims_from_payload(payload: dict[str, object]) -> AccessClaims:
    """Validate the standard access-token claims in a decoded payload and return them."""
    if payload.get(CLAIM_TYPE) != ACCESS_TOKEN_TYPE:
        raise TokenInvalidError("Invalid token type")

    sub = payload.get(CLAIM_SUB)
    if not isinstance(sub, str) or not sub:
        raise TokenInvalidError("Invalid token subject")

    username = payload.get(CLAIM_USERNAME)
    if not isinstance(username, str) or not username:
        raise TokenInvalidError("Token missing username claim")

    avatar_url = payload.get(CLAIM_AVATAR_URL)
    return AccessClaims(
        sub=sub,
        username=username,
        avatar_url=avatar_url if isinstance(avatar_url, str) else None,
    )


__all__ = [
    "ALGORITHM",
    "ACCESS_TOKEN_TYPE",
    "CLAIM_SUB",
    "CLAIM_USERNAME",
    "CLAIM_AVATAR_URL",
    "CLAIM_TYPE",
    "TokenInvalidError",
    "AccessClaims",
    "claims_from_payload",
]
