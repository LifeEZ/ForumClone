from fastapi import APIRouter, HTTPException, status

from app.dependencies import SessionDep
from app.schemas.auth import (
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)
from app.services.auth import (
    InvalidCredentialsError,
    TokenInvalidError,
    login_user,
    refresh_access_token,
    register_user,
    revoke_refresh_token,
)
from app.services.user import UserAlreadyExistsError

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_endpoint(
    data: RegisterRequest,
    session: SessionDep,
) -> TokenResponse:
    try:
        tokens = await register_user(session, data)
    except UserAlreadyExistsError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{exc.field} already taken",
        ) from exc
    await session.commit()
    return tokens


@router.post("/login", response_model=TokenResponse)
async def login_endpoint(
    data: LoginRequest,
    session: SessionDep,
) -> TokenResponse:
    try:
        tokens = await login_user(session, username=data.username, password=data.password)
    except InvalidCredentialsError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        ) from exc
    await session.commit()
    return tokens


@router.post("/refresh", response_model=TokenResponse)
async def refresh_endpoint(
    data: RefreshRequest,
    session: SessionDep,
) -> TokenResponse:
    try:
        tokens = await refresh_access_token(session, data.refresh_token)
    except TokenInvalidError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc
    await session.commit()
    return tokens


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout_endpoint(
    data: LogoutRequest,
    session: SessionDep,
) -> None:
    try:
        await revoke_refresh_token(session, data.refresh_token)
    except TokenInvalidError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc
    await session.commit()
