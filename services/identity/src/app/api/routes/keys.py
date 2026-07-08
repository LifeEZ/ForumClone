from typing import Any

from fastapi import APIRouter

from app.security import jwks

router = APIRouter(tags=["keys"])


@router.get("/.well-known/jwks.json")
async def jwks_endpoint() -> dict[str, Any]:
    """Public RS256 key set — other services fetch this to verify access tokens."""
    return jwks()
