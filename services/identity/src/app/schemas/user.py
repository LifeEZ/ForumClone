from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    email: EmailStr
    display_name: str | None
    bio: str | None
    avatar_url: str | None
    karma: int
    is_active: bool
    created_at: datetime


class UserPublicResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    display_name: str | None
    bio: str | None
    avatar_url: str | None
    karma: int
    created_at: datetime


class UserUpdate(BaseModel):
    display_name: str | None = None
    bio: str | None = None
