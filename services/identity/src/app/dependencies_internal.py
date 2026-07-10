from fastapi import Header, HTTPException, status

from app.config import settings

INTERNAL_TOKEN_HEADER = "X-Hiver-Internal-Token"


async def require_internal_token(
    x_hiver_internal_token: str | None = Header(default=None, alias=INTERNAL_TOKEN_HEADER),
) -> None:
    """Guard service-to-service endpoints (ADR-0003). Fails closed if unset."""
    expected = settings.internal_token
    if not expected or x_hiver_internal_token != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal token",
        )
