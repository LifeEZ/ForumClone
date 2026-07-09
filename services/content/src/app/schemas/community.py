import re
from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, field_validator

if TYPE_CHECKING:
    from app.models.community import Community


# Extensible without a migration — new entries only affect future creates.
RESERVED_SLUGS: frozenset[str] = frozenset(
    {
        "mine",
        "api",
        "admin",
        "mod",
        "all",
        "popular",
        "new",
        "home",
        "create-community",
        "login",
        "register",
        "auth",
        "users",
        "posts",
        "c",
    }
)

# Lowercase alnum groups separated by single hyphens; no leading/trailing hyphen.
_SLUG_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


class CommunityCreate(BaseModel):
    name: str
    display_name: str
    description: str | None = None
    rules: list[dict] | None = None

    @field_validator("name")
    @classmethod
    def _validate_name(cls, value: str) -> str:
        if len(value) < 3 or len(value) > 30:
            raise ValueError("name must be 3–30 characters")
        if not _SLUG_RE.fullmatch(value):
            raise ValueError("name must be lowercase letters, digits, and single hyphens")
        if value in RESERVED_SLUGS:
            raise ValueError(f"'{value}' is a reserved name")
        return value

    @field_validator("display_name")
    @classmethod
    def _validate_display_name(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("display_name must not be empty")
        return value


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
