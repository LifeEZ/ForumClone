from fastapi import APIRouter, Depends, status

from app.dependencies import SessionDep
from app.dependencies_internal import require_internal_token
from app.schemas.karma import KarmaEvent
from app.services.karma import apply_karma_delta

router = APIRouter(prefix="/internal", tags=["internal"])


@router.post("/karma", status_code=status.HTTP_200_OK)
async def apply_karma_endpoint(
    event: KarmaEvent,
    session: SessionDep,
    _: None = Depends(require_internal_token),
) -> dict[str, str | bool]:
    applied = await apply_karma_delta(
        session,
        event_id=event.event_id,
        recipient_user_id=event.recipient_user_id,
        delta=event.delta,
    )
    await session.commit()
    return {"event_id": event.event_id, "applied": applied}
