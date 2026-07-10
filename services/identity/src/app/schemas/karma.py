from pydantic import BaseModel


class KarmaEvent(BaseModel):
    event_id: str
    recipient_user_id: str
    delta: int
    target_type: str
    target_id: str
    voter_user_id: str
