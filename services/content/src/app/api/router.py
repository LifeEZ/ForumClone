from fastapi import APIRouter

from app.api.routes import communities, posts, votes

api_router = APIRouter()

api_router.include_router(communities.router)
api_router.include_router(posts.router)
api_router.include_router(votes.router)
