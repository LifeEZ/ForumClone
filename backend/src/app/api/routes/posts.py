"""Post routes — implemented in Phase 3."""

from fastapi import APIRouter

router = APIRouter(prefix="/posts", tags=["posts"])
