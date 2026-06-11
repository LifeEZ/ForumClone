from collections.abc import AsyncGenerator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_factory

_bearer = HTTPBearer(auto_error=False)


async def get_session() -> AsyncGenerator[AsyncSession]:
    async with async_session_factory() as session:
        yield session


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),  # noqa: B008
    session: AsyncSession = Depends(get_session),  # noqa: B008
) -> "User":  # type: ignore[name-defined]  # noqa: F821
    """Decode the access JWT and return the authenticated User row."""
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


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),  # noqa: B008
    session: AsyncSession = Depends(get_session),  # noqa: B008
) -> "User | None":  # type: ignore[name-defined]  # noqa: F821
    """Like get_current_user but returns None for unauthenticated requests."""
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials=credentials, session=session)
    except HTTPException:
        return None
