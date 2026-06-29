from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser, TokenInvalidError, verify_token
from app.database import async_session_factory

_bearer = HTTPBearer(auto_error=False)


async def get_session() -> AsyncGenerator[AsyncSession]:
    async with async_session_factory() as session:
        yield session


SessionDep = Annotated[AsyncSession, Depends(get_session)]
BearerCredentials = Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)]


async def get_current_user(credentials: BearerCredentials) -> CurrentUser:
    """Authenticate from JWT claims alone — no database lookup."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        return await verify_token(credentials.credentials)
    except TokenInvalidError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


CurrentUserDep = Annotated[CurrentUser, Depends(get_current_user)]


async def get_current_user_optional(credentials: BearerCredentials) -> CurrentUser | None:
    if credentials is None:
        return None
    try:
        return await verify_token(credentials.credentials)
    except TokenInvalidError:
        return None


CurrentUserOptionalDep = Annotated[CurrentUser | None, Depends(get_current_user_optional)]
