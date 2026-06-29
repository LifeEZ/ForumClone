from fastapi import APIRouter, HTTPException, Query

from app.dependencies import CurrentUserDep, CurrentUserOptionalDep, SessionDep
from app.schemas.community import CommunityResponse
from app.schemas.post import PostFeedItem
from app.services.community import CommunityNotFoundError, get_community_by_name, list_communities
from app.services.membership import (
    AlreadyMemberError,
    NotMemberError,
    is_member,
    join_community,
    leave_community,
    list_joined_communities,
)
from app.services.post import list_posts

router = APIRouter(prefix="/communities", tags=["communities"])


def _community_response(community, *, is_member_value: bool | None) -> CommunityResponse:
    return CommunityResponse.model_validate(community).model_copy(
        update={"is_member": is_member_value}
    )


@router.get("", response_model=list[CommunityResponse])
async def list_communities_endpoint(
    session: SessionDep,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> list[CommunityResponse]:
    return await list_communities(session, offset=offset, limit=limit)


@router.get("/mine", response_model=list[CommunityResponse])
async def list_joined_communities_endpoint(
    session: SessionDep,
    user: CurrentUserDep,
) -> list[CommunityResponse]:
    communities = await list_joined_communities(session, user.id)
    return [_community_response(c, is_member_value=True) for c in communities]


@router.get("/{name}/posts", response_model=list[PostFeedItem])
async def list_community_posts_endpoint(
    name: str,
    session: SessionDep,
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> list[PostFeedItem]:
    try:
        community = await get_community_by_name(session, name)
    except CommunityNotFoundError:
        raise HTTPException(status_code=404, detail="Community not found") from None
    posts = await list_posts(session, community_id=community.id, offset=offset, limit=limit)
    return [PostFeedItem.from_post(post) for post in posts]


@router.post("/{name}/join", response_model=CommunityResponse)
async def join_community_endpoint(
    name: str,
    session: SessionDep,
    user: CurrentUserDep,
) -> CommunityResponse:
    try:
        community = await join_community(session, name, user)
    except CommunityNotFoundError:
        raise HTTPException(status_code=404, detail="Community not found") from None
    except AlreadyMemberError:
        raise HTTPException(status_code=409, detail="Already a member of this community") from None
    await session.commit()
    return _community_response(community, is_member_value=True)


@router.delete("/{name}/join", response_model=CommunityResponse)
async def leave_community_endpoint(
    name: str,
    session: SessionDep,
    user: CurrentUserDep,
) -> CommunityResponse:
    try:
        community = await leave_community(session, name, user)
    except CommunityNotFoundError:
        raise HTTPException(status_code=404, detail="Community not found") from None
    except NotMemberError:
        raise HTTPException(status_code=404, detail="Not a member of this community") from None
    await session.commit()
    return _community_response(community, is_member_value=False)


@router.get("/{name}", response_model=CommunityResponse)
async def get_community_endpoint(
    name: str,
    session: SessionDep,
    user: CurrentUserOptionalDep,
) -> CommunityResponse:
    try:
        community = await get_community_by_name(session, name)
    except CommunityNotFoundError:
        raise HTTPException(status_code=404, detail="Community not found") from None
    member = await is_member(session, user.id, community.id) if user else None
    return _community_response(community, is_member_value=member)
