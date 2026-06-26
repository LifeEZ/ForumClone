"""Comment routes — implemented in slice 6 (service-first)."""

from fastapi import APIRouter

router = APIRouter(prefix="/comments", tags=["comments"])
