from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict

if TYPE_CHECKING:
    from app.models.community import Community


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
    is_member: bool | None = None

    @classmethod
    def from_community(
        cls,
        community: "Community",
        *,
        member_count: int,
        is_member: bool | None = None,
    ) -> "CommunityResponse":
        """Build a response from a Community row plus its derived member count.

        `member_count` is no longer a column on `Community` (Candidate D); it is
        computed from `community_memberships` and passed in. Constructing explicitly
        avoids `from_attributes` reaching for a column that no longer exists.
        """
        return cls(
            id=community.id,
            name=community.name,
            display_name=community.display_name,
            description=community.description,
            rules=community.rules,
            icon_url=community.icon_url,
            banner_url=community.banner_url,
            creator_id=community.creator_id,
            member_count=member_count,
            created_at=community.created_at,
            is_member=is_member,
        )
