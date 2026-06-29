from typing import Any

from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

from app.security import jwks, public_key_pem

router = APIRouter(tags=["keys"])


@router.get("/.well-known/jwks.json")
async def jwks_endpoint() -> dict[str, Any]:
    """Public RS256 key set — other services fetch this to verify access tokens."""
    return jwks()


@router.get("/auth/public-key", response_class=PlainTextResponse)
async def public_key_endpoint() -> str:
    return public_key_pem()
