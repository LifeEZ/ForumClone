from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_factory
from app.models.user import User

_bearer = HTTPBearer(auto_error=False)


async def get_session() -> AsyncGenerator[AsyncSession]:
    async with async_session_factory() as session:
        yield session


SessionDep = Annotated[AsyncSession, Depends(get_session)]
BearerCredentials = Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)]


async def get_current_user(
    credentials: BearerCredentials,
    session: SessionDep,
) -> User:
    """Decode the access JWT and return the authenticated User row (DB-backed)."""
    from app.services.auth import TokenInvalidError, get_user_from_token

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        user = await get_user_from_token(session, credentials.credentials)
    except TokenInvalidError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    return user


CurrentUserDep = Annotated[User, Depends(get_current_user)]
