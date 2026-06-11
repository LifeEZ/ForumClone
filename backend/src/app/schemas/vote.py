from typing import Literal

from pydantic import BaseModel, ConfigDict


class VoteRequest(BaseModel):
    target_type: Literal["post", "comment"]
    target_id: str
    value: Literal[-1, 0, 1]


class VoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    target_type: str
    target_id: str
    value: int
