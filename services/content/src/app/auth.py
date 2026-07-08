"""Stateless token verification for the Content service.

Content never loads a user from a database — there is no users table here. It
verifies the RS256 access token with Identity's public key (resolved from
Identity's JWKS by `app.keyresolver`) and reads the claims into a lightweight
`CurrentUser`. The `username` claim is what gets snapshotted onto posts/comments
at write time (ADR-0002).
"""

from __future__ import annotations

from dataclasses import dataclass

import jwt
from hiver_auth_contract import (
    ALGORITHM,
    TokenInvalidError,
    claims_from_payload,
)

from app.keyresolver import KeyResolverError, get_resolver


@dataclass(frozen=True)
class CurrentUser:
    id: str
    username: str
    avatar_url: str | None = None


async def verify_token(token: str) -> CurrentUser:
    resolver = get_resolver()
    try:
        key = await resolver.get_signing_key(token)
        payload = jwt.decode(token, key, algorithms=[ALGORITHM])
    except (KeyResolverError, jwt.PyJWTError) as exc:
        raise TokenInvalidError("Invalid or expired access token") from exc

    claims = claims_from_payload(payload)
    return CurrentUser(id=claims.sub, username=claims.username, avatar_url=claims.avatar_url)
