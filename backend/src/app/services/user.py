from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.auth import RegisterRequest


class UserAlreadyExistsError(Exception):
    def __init__(self, field: str, value: str) -> None:
        self.field = field
        self.value = value
        super().__init__(f"User with {field} '{value}' already exists")


async def get_user_by_id(session: AsyncSession, user_id: str) -> User | None:
    return await session.get(User, user_id)


async def get_user_by_username(session: AsyncSession, username: str) -> User | None:
    result = await session.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def create_user(session: AsyncSession, data: RegisterRequest, *, password_hash: str) -> User:
    if await get_user_by_username(session, data.username):
        raise UserAlreadyExistsError("username", data.username)
    if await get_user_by_email(session, data.email):
        raise UserAlreadyExistsError("email", data.email)

    user = User(
        username=data.username,
        email=data.email,
        password_hash=password_hash,
        display_name=data.display_name or data.username,
    )
    session.add(user)
    await session.flush()
    return user
