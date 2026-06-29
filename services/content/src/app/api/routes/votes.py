"""Vote routes — implemented in slice 7 (score local; karma via event to Identity)."""

from fastapi import APIRouter

router = APIRouter(prefix="/votes", tags=["votes"])
