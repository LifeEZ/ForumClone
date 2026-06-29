from fastapi import APIRouter, HTTPException, Query

from app.dependencies import SessionDep
from app.schemas.post import PostFeedItem
from app.services.post import PostNotFoundError, get_post, list_posts

router = APIRouter(prefix="/posts", tags=["posts"])


@router.get("", response_model=list[PostFeedItem])
async def list_posts_endpoint(
    session: SessionDep,
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> list[PostFeedItem]:
    posts = await list_posts(session, offset=offset, limit=limit)
    return [PostFeedItem.from_post(post) for post in posts]


@router.get("/{post_id}", response_model=PostFeedItem)
async def get_post_endpoint(post_id: str, session: SessionDep) -> PostFeedItem:
    try:
        post = await get_post(session, post_id)
    except PostNotFoundError:
        raise HTTPException(status_code=404, detail="Post not found") from None
    return PostFeedItem.from_post(post)
