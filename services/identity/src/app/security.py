"""RS256 key management and JWKS publication.

Identity is the only service that holds the private key. It signs access tokens
with RS256; every other service verifies them with the public key fetched from
the JWKS endpoint exposed here. In local dev (no PEM configured) an ephemeral
keypair is generated at startup — fine for a demo, but tokens won't survive a
restart, which is exactly the trade-off documented in ADR-0002.
"""

from __future__ import annotations

import base64
from functools import lru_cache
from typing import Any

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPrivateKey, RSAPublicKey

from app.config import settings


def _generate_keypair() -> tuple[str, str]:
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_pem = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode()
    public_pem = (
        key.public_key()
        .public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
        .decode()
    )
    return private_pem, public_pem


@lru_cache(maxsize=1)
def _keys() -> tuple[str, str]:
    if settings.jwt_private_key_pem and settings.jwt_public_key_pem:
        return settings.jwt_private_key_pem, settings.jwt_public_key_pem
    return _generate_keypair()


def private_key_pem() -> str:
    return _keys()[0]


def public_key_pem() -> str:
    return _keys()[1]


def _public_key() -> RSAPublicKey:
    key = serialization.load_pem_public_key(public_key_pem().encode())
    assert isinstance(key, RSAPublicKey)
    return key


def _b64url_uint(value: int) -> str:
    raw = value.to_bytes((value.bit_length() + 7) // 8, "big")
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def jwks() -> dict[str, Any]:
    """JSON Web Key Set for the current public key (RS256)."""
    numbers = _public_key().public_numbers()
    return {
        "keys": [
            {
                "kty": "RSA",
                "use": "sig",
                "alg": "RS256",
                "kid": settings.jwt_key_id,
                "n": _b64url_uint(numbers.n),
                "e": _b64url_uint(numbers.e),
            }
        ]
    }


def private_key() -> RSAPrivateKey:
    key = serialization.load_pem_private_key(private_key_pem().encode(), password=None)
    assert isinstance(key, RSAPrivateKey)
    return key
