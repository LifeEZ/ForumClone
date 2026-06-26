from fastapi import APIRouter, HTTPException

from app.dependencies import CurrentUserDep, SessionDep
from app.models.user import User
from app.schemas.user import UserPublicResponse, UserResponse
from app.services.user import get_user_by_id

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: CurrentUserDep) -> User:
    return current_user


@router.get("/{user_id}", response_model=UserPublicResponse)
async def get_user_endpoint(user_id: str, session: SessionDep) -> User:
    user = await get_user_by_id(session, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user
