"""Resolve the RSA public key that signed an access token, via Identity's JWKS.

Content verifies RS256 tokens with Identity's public key. Identity publishes a
JWKS at `/.well-known/jwks.json` — one key per `kid` — and every token it signs
carries the `kid` it was signed with in its header. The resolver reads that
`kid`, looks the key up in the JWKS, and returns it.

The JWKS is cached with a TTL and refetched on demand when a `kid` is not in the
cache, so key rotation and the ephemeral-dev-keypair restart case are handled
without the old "decode-fails-then-refetch-once" hack (ADR-0002). This is the one
place that knows how a signing key is discovered; `verify_token` just asks it for
the key.
"""

from __future__ import annotations

import time
from typing import cast

import httpx
import jwt
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPublicKey
from jwt.algorithms import RSAAlgorithm

from app.config import settings

# How long a fetched JWKS is served before a refetch is forced. Long enough to
# avoid hammering Identity on every request, short enough to pick up rotation.
_JWKS_TTL_SECONDS = 600


class KeyResolverError(Exception):
    """Raised when the signing key for a token cannot be resolved."""


class KeyResolver:
    """Maps a token's `kid` to its verifying key, backed by a TTL-cached JWKS."""

    def __init__(self, jwks_url: str, *, ttl_seconds: int = _JWKS_TTL_SECONDS) -> None:
        self._jwks_url = jwks_url
        self._ttl_seconds = ttl_seconds
        self._keys_by_kid: dict[str, RSAPublicKey] = {}
        self._fetched_at: float = 0.0

    @classmethod
    def for_keys(cls, keys_by_kid: dict[str, RSAPublicKey]) -> KeyResolver:
        """Build a resolver preloaded with fixed keys — used by tests to avoid HTTP."""
        resolver = cls(jwks_url="", ttl_seconds=10**9)
        resolver._keys_by_kid = dict(keys_by_kid)
        resolver._fetched_at = time.monotonic()
        return resolver

    def _is_fresh(self) -> bool:
        return bool(self._keys_by_kid) and (time.monotonic() - self._fetched_at) < self._ttl_seconds

    async def _fetch(self) -> None:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(self._jwks_url)
            resp.raise_for_status()
            jwks = resp.json()
        keys: dict[str, RSAPublicKey] = {}
        for jwk in jwks.get("keys", []):
            kid = jwk.get("kid")
            if not kid:
                continue
            keys[kid] = cast(RSAPublicKey, RSAAlgorithm.from_jwk(jwk))
        if not keys:
            raise KeyResolverError("JWKS contained no usable keys")
        self._keys_by_kid = keys
        self._fetched_at = time.monotonic()

    async def _keys(self) -> dict[str, RSAPublicKey]:
        if not self._is_fresh():
            await self._fetch()
        return self._keys_by_kid

    async def get_signing_key(self, token: str) -> RSAPublicKey:
        try:
            kid = jwt.get_unverified_header(token).get("kid")
        except jwt.PyJWTError as exc:
            raise KeyResolverError("Could not read token header") from exc
        if not kid:
            raise KeyResolverError("Token header missing kid")

        keys = await self._keys()
        key = keys.get(kid)
        if key is not None:
            return key

        await self._fetch()
        key = self._keys_by_kid.get(kid)
        if key is None:
            raise KeyResolverError(f"No key in JWKS for kid={kid!r}")
        return key


_resolver: KeyResolver | None = None


def get_resolver() -> KeyResolver:
    global _resolver
    if _resolver is None:
        _resolver = KeyResolver(f"{settings.identity_url}/api/v1/.well-known/jwks.json")
    return _resolver


def set_resolver_for_testing(resolver: KeyResolver | None) -> None:
    global _resolver
    _resolver = resolver
