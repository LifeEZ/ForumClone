from fastapi import APIRouter, HTTPException, status

from app.dependencies import CurrentUserDep, SessionDep
from app.schemas.vote import VoteRequest, VoteResponse
from app.services.vote import SelfVoteError, TargetNotFoundError, cast_vote

router = APIRouter(prefix="/votes", tags=["votes"])


@router.post("", response_model=VoteResponse)
async def cast_vote_endpoint(
    data: VoteRequest,
    session: SessionDep,
    user: CurrentUserDep,
) -> VoteResponse:
    try:
        response = await cast_vote(session, data, voter=user)
    except TargetNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{exc.target_type.capitalize()} not found",
        ) from exc
    except SelfVoteError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot vote on your own content",
        ) from exc
    await session.commit()
    return response
