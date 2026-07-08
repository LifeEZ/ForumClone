import time
from datetime import UTC, datetime, timedelta

import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from hiver_auth_contract import (
    ACCESS_TOKEN_TYPE,
    ALGORITHM,
    CLAIM_SUB,
    CLAIM_TYPE,
    CLAIM_USERNAME,
)

from app.keyresolver import KeyResolver, KeyResolverError


def _make_keypair() -> tuple[str, object]:
    priv = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    priv_pem = priv.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode()
    return priv_pem, priv.public_key()


def _mint(priv_pem: str, kid: str | None) -> str:
    payload = {
        CLAIM_SUB: "u",
        CLAIM_USERNAME: "x",
        CLAIM_TYPE: ACCESS_TOKEN_TYPE,
        "exp": datetime.now(UTC) + timedelta(minutes=5),
    }
    headers = {"kid": kid} if kid else {}
    return jwt.encode(payload, priv_pem, algorithm=ALGORITHM, headers=headers)


class _ScriptedResolver(KeyResolver):
    """KeyResolver with a scripted sequence of fetch results, no HTTP."""

    def __init__(self, fetches: list[dict[str, object]], ttl_seconds: int) -> None:
        super().__init__("", ttl_seconds=ttl_seconds)
        self._fetches = fetches
        self.fetch_count = 0

    async def _fetch(self) -> None:
        keys = self._fetches[min(self.fetch_count, len(self._fetches) - 1)]
        self.fetch_count += 1
        self._keys_by_kid = dict(keys)
        self._fetched_at = time.monotonic()


@pytest.mark.anyio
async def test_serves_from_cache_within_ttl() -> None:
    priv_pem, pub = _make_keypair()
    resolver = _ScriptedResolver([{"k1": pub}], ttl_seconds=1000)
    token = _mint(priv_pem, "k1")

    await resolver.get_signing_key(token)
    await resolver.get_signing_key(token)

    assert resolver.fetch_count == 1


@pytest.mark.anyio
async def test_refetches_when_ttl_expires() -> None:
    priv_pem, pub = _make_keypair()
    resolver = _ScriptedResolver([{"k1": pub}], ttl_seconds=0)
    token = _mint(priv_pem, "k1")

    await resolver.get_signing_key(token)
    await resolver.get_signing_key(token)

    assert resolver.fetch_count == 2


@pytest.mark.anyio
async def test_unknown_kid_triggers_one_refetch() -> None:
    priv1_pem, pub1 = _make_keypair()
    priv2_pem, pub2 = _make_keypair()
    # First fetch publishes only k1; the refetch publishes k2.
    resolver = _ScriptedResolver([{"k1": pub1}, {"k2": pub2}], ttl_seconds=1000)
    token = _mint(priv2_pem, "k2")

    key = await resolver.get_signing_key(token)

    assert key is pub2
    assert resolver.fetch_count == 2


@pytest.mark.anyio
async def test_missing_kid_raises() -> None:
    priv_pem, _ = _make_keypair()
    resolver = _ScriptedResolver([{"k1": object()}], ttl_seconds=1000)
    token = _mint(priv_pem, kid=None)

    with pytest.raises(KeyResolverError, match="missing kid"):
        await resolver.get_signing_key(token)


@pytest.mark.anyio
async def test_kid_not_in_jwks_raises() -> None:
    priv_pem, pub1 = _make_keypair()
    resolver = _ScriptedResolver([{"k1": pub1}], ttl_seconds=1000)
    token = _mint(priv_pem, "k-missing")

    with pytest.raises(KeyResolverError, match="No key in JWKS"):
        await resolver.get_signing_key(token)
    # Looked twice: initial fetch + the unknown-kid refetch.
    assert resolver.fetch_count == 2
