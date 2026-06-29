"""Stateless token verification for the Content service.

Content never loads a user from a database — there is no users table here. It
verifies the RS256 access token with Identity's public key (fetched once from
Identity's JWKS/public-key endpoint and cached) and reads the claims into a
lightweight `CurrentUser`. The `username` claim is what gets snapshotted onto
posts/comments at write time (ADR-0002).
"""

from __future__ import annotations

from dataclasses import dataclass

import httpx
import jwt

from app.config import settings

ALGORITHM = "RS256"
ACCESS_TOKEN_TYPE = "access"

_public_key_cache: str | None = None


class TokenInvalidError(Exception):
    pass


@dataclass(frozen=True)
class CurrentUser:
    id: str
    username: str
    avatar_url: str | None = None


async def _fetch_public_key() -> str:
    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.get(f"{settings.identity_url}/api/v1/auth/public-key")
        resp.raise_for_status()
        return resp.text


async def get_public_key(*, force_refresh: bool = False) -> str:
    global _public_key_cache
    if _public_key_cache is None or force_refresh:
        _public_key_cache = await _fetch_public_key()
    return _public_key_cache


def set_public_key_for_testing(pem: str | None) -> None:
    global _public_key_cache
    _public_key_cache = pem


async def verify_token(token: str) -> CurrentUser:
    public_key = await get_public_key()
    try:
        payload = jwt.decode(token, public_key, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        # Key may have rotated — refetch once and retry before giving up.
        try:
            public_key = await get_public_key(force_refresh=True)
            payload = jwt.decode(token, public_key, algorithms=[ALGORITHM])
        except jwt.PyJWTError as exc:
            raise TokenInvalidError("Invalid or expired access token") from exc

    if payload.get("type") != ACCESS_TOKEN_TYPE:
        raise TokenInvalidError("Invalid token type")

    user_id = payload.get("sub")
    username = payload.get("username")
    if not isinstance(user_id, str) or not user_id:
        raise TokenInvalidError("Invalid token subject")
    if not isinstance(username, str) or not username:
        raise TokenInvalidError("Token missing username claim")

    return CurrentUser(id=user_id, username=username, avatar_url=payload.get("avatar_url"))
