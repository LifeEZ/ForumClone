import secrets
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import RegisterRequest, TokenResponse
from app.services.user import create_user, get_user_by_id, get_user_by_username

ACCESS_TOKEN_TYPE = "access"


class TokenInvalidError(Exception):
    pass


class UserNotFoundError(Exception):
    def __init__(self, identifier: str) -> None:
        self.identifier = identifier
        super().__init__(f"User '{identifier}' not found")


class InvalidCredentialsError(Exception):
    pass


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain_password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(plain_password.encode(), password_hash.encode())


def create_access_token(user_id: str) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": user_id,
        "exp": expire,
        "type": ACCESS_TOKEN_TYPE,
    }
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def decode_access_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
    except jwt.PyJWTError as exc:
        raise TokenInvalidError("Invalid or expired access token") from exc

    if payload.get("type") != ACCESS_TOKEN_TYPE:
        raise TokenInvalidError("Invalid token type")

    user_id = payload.get("sub")
    if not isinstance(user_id, str) or not user_id:
        raise TokenInvalidError("Invalid token subject")

    return user_id


async def _create_refresh_token(session: AsyncSession, user_id: str) -> str:
    token_value = secrets.token_urlsafe(32)
    expires_at = datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)
    refresh_token = RefreshToken(
        user_id=user_id,
        token=token_value,
        expires_at=expires_at,
    )
    session.add(refresh_token)
    await session.flush()
    return token_value


async def _issue_tokens(session: AsyncSession, user: User) -> TokenResponse:
    access_token = create_access_token(user.id)
    refresh_token = await _create_refresh_token(session, user.id)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


async def register_user(session: AsyncSession, data: RegisterRequest) -> TokenResponse:
    password_hash = hash_password(data.password)
    user = await create_user(session, data, password_hash=password_hash)
    return await _issue_tokens(session, user)


async def login_user(session: AsyncSession, *, username: str, password: str) -> TokenResponse:
    user = await get_user_by_username(session, username)
    if user is None or not verify_password(password, user.password_hash):
        raise InvalidCredentialsError
    if not user.is_active:
        raise InvalidCredentialsError
    return await _issue_tokens(session, user)


async def refresh_access_token(session: AsyncSession, refresh_token_value: str) -> TokenResponse:
    result = await session.execute(
        select(RefreshToken).where(RefreshToken.token == refresh_token_value)
    )
    refresh_token = result.scalar_one_or_none()
    if refresh_token is None:
        raise TokenInvalidError("Invalid refresh token")
    if refresh_token.revoked:
        raise TokenInvalidError("Refresh token has been revoked")
    if refresh_token.expires_at.replace(tzinfo=UTC) <= datetime.now(UTC):
        raise TokenInvalidError("Refresh token has expired")

    user = await get_user_by_id(session, refresh_token.user_id)
    if user is None or not user.is_active:
        raise TokenInvalidError("User not found or inactive")

    refresh_token.revoked = True
    return await _issue_tokens(session, user)


async def revoke_refresh_token(session: AsyncSession, refresh_token_value: str) -> None:
    result = await session.execute(
        select(RefreshToken).where(RefreshToken.token == refresh_token_value)
    )
    refresh_token = result.scalar_one_or_none()
    if refresh_token is None:
        raise TokenInvalidError("Invalid refresh token")
    refresh_token.revoked = True


async def get_user_from_token(session: AsyncSession, token: str) -> User:
    user_id = decode_access_token(token)
    user = await get_user_by_id(session, user_id)
    if user is None:
        raise TokenInvalidError("User not found")
    if not user.is_active:
        raise TokenInvalidError("User account is inactive")
    return user
