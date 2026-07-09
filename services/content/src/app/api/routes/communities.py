from fastapi import APIRouter, HTTPException, Query, status

from app.dependencies import CurrentUserDep, CurrentUserOptionalDep, SessionDep
from app.schemas.community import CommunityCreate, CommunityResponse
from app.schemas.post import PostFeedItem
from app.services.community import (
    CommunityAlreadyExistsError,
    CommunityNotFoundError,
    create_community,
    get_community_by_name,
    list_communities,
)
from app.services.membership import (
    AlreadyMemberError,
    NotMemberError,
    count_members,
    count_members_for,
    is_member,
    join_community,
    leave_community,
    list_joined_communities,
)
from app.services.post import list_posts

router = APIRouter(prefix="/communities", tags=["communities"])


@router.get("", response_model=list[CommunityResponse])
async def list_communities_endpoint(
    session: SessionDep,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> list[CommunityResponse]:
    items = await list_communities(session, offset=offset, limit=limit)
    return [
        CommunityResponse.from_community(item.community, member_count=item.member_count)
        for item in items
    ]


@router.get("/mine", response_model=list[CommunityResponse])
async def list_joined_communities_endpoint(
    session: SessionDep,
    user: CurrentUserDep,
) -> list[CommunityResponse]:
    communities = await list_joined_communities(session, user.id)
    counts = await count_members_for(session, [c.id for c in communities])
    return [
        CommunityResponse.from_community(c, member_count=counts.get(c.id, 0), is_member=True)
        for c in communities
    ]


@router.post("", response_model=CommunityResponse, status_code=status.HTTP_201_CREATED)
async def create_community_endpoint(
    data: CommunityCreate,
    session: SessionDep,
    user: CurrentUserDep,
) -> CommunityResponse:
    try:
        community = await create_community(session, data, creator_id=user.id)
    except CommunityAlreadyExistsError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Community '{exc.name}' already exists",
        ) from exc
    response = CommunityResponse.from_community(community, member_count=1, is_member=True)
    await session.commit()
    return response


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
    count = await count_members(session, community.id)
    response = CommunityResponse.from_community(community, member_count=count, is_member=True)
    await session.commit()
    return response


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
    count = await count_members(session, community.id)
    response = CommunityResponse.from_community(community, member_count=count, is_member=False)
    await session.commit()
    return response


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
    count = await count_members(session, community.id)
    return CommunityResponse.from_community(community, member_count=count, is_member=member)
