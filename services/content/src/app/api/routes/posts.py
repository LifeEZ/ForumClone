from fastapi import APIRouter, HTTPException, Query, status

from app.dependencies import CurrentUserDep, CurrentUserOptionalDep, SessionDep
from app.schemas.comment import CommentCreate, CommentResponse
from app.schemas.post import PostFeedItem
from app.services.comment import (
    CommentParentMismatchError,
    MaxCommentDepthError,
    ParentCommentNotFoundError,
    create_comment,
    list_comments_for_post,
)
from app.services.membership import list_home_posts
from app.services.post import PostNotFoundError, get_post, list_posts
from app.services.vote import get_user_votes

router = APIRouter(prefix="/posts", tags=["posts"])


@router.get("/home", response_model=list[PostFeedItem])
async def list_home_posts_endpoint(
    session: SessionDep,
    user: CurrentUserDep,
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> list[PostFeedItem]:
    posts = await list_home_posts(session, user.id, offset=offset, limit=limit)
    votes = await get_user_votes(session, user.id, "post", [p.id for p in posts])
    return [PostFeedItem.from_post(post, user_vote=votes.get(post.id, 0)) for post in posts]


@router.get("", response_model=list[PostFeedItem])
async def list_posts_endpoint(
    session: SessionDep,
    user: CurrentUserOptionalDep,
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> list[PostFeedItem]:
    posts = await list_posts(session, offset=offset, limit=limit)
    votes = (
        await get_user_votes(session, user.id, "post", [p.id for p in posts])
        if user is not None
        else {}
    )
    return [PostFeedItem.from_post(post, user_vote=votes.get(post.id, 0)) for post in posts]


@router.get("/{post_id}", response_model=PostFeedItem)
async def get_post_endpoint(
    post_id: str,
    session: SessionDep,
    user: CurrentUserOptionalDep,
) -> PostFeedItem:
    try:
        post = await get_post(session, post_id)
    except PostNotFoundError:
        raise HTTPException(status_code=404, detail="Post not found") from None
    user_vote = 0
    if user is not None:
        votes = await get_user_votes(session, user.id, "post", [post.id])
        user_vote = votes.get(post.id, 0)
    return PostFeedItem.from_post(post, user_vote=user_vote)


@router.get("/{post_id}/comments", response_model=list[CommentResponse])
async def list_post_comments_endpoint(
    post_id: str,
    session: SessionDep,
    user: CurrentUserOptionalDep,
) -> list[CommentResponse]:
    try:
        post = await get_post(session, post_id)
    except PostNotFoundError:
        raise HTTPException(status_code=404, detail="Post not found") from None
    return await list_comments_for_post(session, post.id, viewer_id=user.id if user else None)


@router.post(
    "/{post_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_post_comment_endpoint(
    post_id: str,
    data: CommentCreate,
    session: SessionDep,
    user: CurrentUserDep,
) -> CommentResponse:
    try:
        post = await get_post(session, post_id)
    except PostNotFoundError:
        raise HTTPException(status_code=404, detail="Post not found") from None
    try:
        comment = await create_comment(session, post, data, author=user)
    except ParentCommentNotFoundError:
        raise HTTPException(status_code=404, detail="Parent comment not found") from None
    except CommentParentMismatchError:
        raise HTTPException(
            status_code=400,
            detail="Parent comment does not belong to this post",
        ) from None
    except MaxCommentDepthError:
        raise HTTPException(
            status_code=422,
            detail=f"Maximum comment depth ({10}) reached",
        ) from None
    await session.commit()
    return CommentResponse.from_comment(comment)
