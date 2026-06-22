from fastapi import APIRouter, HTTPException, Query

from app.dependencies import SessionDep
from app.schemas.community import CommunityResponse
from app.schemas.post import PostFeedItem
from app.services.community import CommunityNotFoundError, get_community_by_name, list_communities
from app.services.post import list_posts

router = APIRouter(prefix="/communities", tags=["communities"])


@router.get("", response_model=list[CommunityResponse])
async def list_communities_endpoint(
    session: SessionDep,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> list[CommunityResponse]:
    return await list_communities(session, offset=offset, limit=limit)


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


@router.get("/{name}", response_model=CommunityResponse)
async def get_community_endpoint(name: str, session: SessionDep) -> CommunityResponse:
    try:
        return await get_community_by_name(session, name)
    except CommunityNotFoundError:
        raise HTTPException(status_code=404, detail="Community not found") from None
