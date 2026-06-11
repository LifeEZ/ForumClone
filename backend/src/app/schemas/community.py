from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CommunityCreate(BaseModel):
    name: str
    display_name: str
    description: str | None = None
    rules: list[dict] | None = None


class CommunityUpdate(BaseModel):
    display_name: str | None = None
    description: str | None = None
    rules: list[dict] | None = None


class CommunityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    display_name: str
    description: str | None
    rules: list | None
    icon_url: str | None
    banner_url: str | None
    creator_id: str
    member_count: int
    created_at: datetime
