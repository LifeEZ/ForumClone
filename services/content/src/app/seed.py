"""Load demo seed content into content_db.

Author fields are denormalized snapshots (ADR-0002) — the matching users live in
identity_db. Run after migrations:
    uv run python -m app.seed
"""

import asyncio
from datetime import UTC, datetime, timedelta

from sqlalchemy import select

from app.database import async_session_factory
from app.models.community import Community
from app.models.membership import CommunityMembership
from app.models.post import Post

SEED_MARKER_COMMUNITY = "films"

# Snapshot of identity seed usernames, mirrored here on purpose. Karma is not
# snapshotted — see app.schemas.user.AuthorResponse.
SEED_AUTHORS = {
    "u-seed-cinema": "cinema_fan",
    "u-seed-vinyl": "vinyl_head",
    "u-seed-css": "css_wizard",
}

SEED_COMMUNITIES = [
    {
        "id": "c1",
        "name": "films",
        "display_name": "Films",
        "description": "Discuss movies, directors, and everything on screen.",
        "member_count": 14200,
        "icon_url": "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=150&q=80",
        "banner_url": "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80",
        "creator_id": "u-seed-cinema",
    },
    {
        "id": "c2",
        "name": "music",
        "display_name": "Music",
        "description": "Albums, artists, genres, and live shows.",
        "member_count": 85000,
        "icon_url": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=150&q=80",
        "banner_url": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
        "creator_id": "u-seed-vinyl",
    },
    {
        "id": "c3",
        "name": "webdev",
        "display_name": "Web Dev",
        "description": "Frontend, backend, and shipping things on the web.",
        "member_count": 32400,
        "icon_url": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=150&q=80",
        "banner_url": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
        "creator_id": "u-seed-css",
    },
]

SEED_POSTS = [
    {
        "id": "p1",
        "community_id": "c1",
        "author_id": "u-seed-cinema",
        "title": "Stop using pure black for dark mode backgrounds",
        "content": "Pure black (#000000) causes eye strain because of extreme contrast with white text. Use a tinted dark color instead — like a dark forest green — for a softer, more readable UI.",
        "score": 330,
        "comment_count": 45,
        "days_ago": 3,
    },
    {
        "id": "p-films-2",
        "community_id": "c1",
        "author_id": "u-seed-cinema",
        "title": "Denis Villeneuve's use of silence in Dune",
        "content": "The pauses between dialogue hit harder than the score. What other directors do this well?",
        "score": 210,
        "comment_count": 18,
        "days_ago": 5,
    },
    {
        "id": "p-films-3",
        "community_id": "c1",
        "author_id": "u-seed-vinyl",
        "title": "Comfort rewatches that never get old",
        "content": "Mine is The Grand Budapest Hotel. Perfect palette, perfect pacing.",
        "score": 156,
        "comment_count": 62,
        "days_ago": 7,
    },
    {
        "id": "p-films-4",
        "community_id": "c1",
        "author_id": "u-seed-css",
        "title": "Letterboxd vs IMDb for logging films",
        "content": "Letterboxd wins on community vibes. IMDb still has better metadata. Where do you log?",
        "score": 89,
        "comment_count": 11,
        "days_ago": 9,
    },
    {
        "id": "p2",
        "community_id": "c2",
        "author_id": "u-seed-vinyl",
        "title": "Albums that sound better on vinyl",
        "content": "Some mixes are mastered differently for vinyl. What records do you think benefit most from the format?",
        "score": 845,
        "comment_count": 128,
        "days_ago": 3,
    },
    {
        "id": "p-music-2",
        "community_id": "c2",
        "author_id": "u-seed-cinema",
        "title": "Best live albums of the last decade",
        "content": "Khruangbin's live sets are unmatched. What are your picks?",
        "score": 412,
        "comment_count": 74,
        "days_ago": 4,
    },
    {
        "id": "p-music-3",
        "community_id": "c2",
        "author_id": "u-seed-css",
        "title": "DAW workflow tips for faster demos",
        "content": "Templates and bus routing saved me hours. Share your speed hacks.",
        "score": 198,
        "comment_count": 33,
        "days_ago": 6,
    },
    {
        "id": "p-music-4",
        "community_id": "c2",
        "author_id": "u-seed-vinyl",
        "title": "Genres that clicked for you late",
        "content": "Jazz took until my 30s. Now I can't stop.",
        "score": 267,
        "comment_count": 41,
        "days_ago": 8,
    },
    {
        "id": "p3",
        "community_id": "c3",
        "author_id": "u-seed-css",
        "title": "Container queries changed how I write responsive components",
        "content": "Component-level breakpoints beat viewport-only media queries for reusable UI. Worth learning if you have not tried them yet.",
        "score": 1197,
        "comment_count": 32,
        "days_ago": 4,
    },
    {
        "id": "p-webdev-2",
        "community_id": "c3",
        "author_id": "u-seed-cinema",
        "title": "When to reach for TanStack Query vs plain fetch",
        "content": "Caching and retries matter once you have mutations. For read-only pages fetch is fine.",
        "score": 534,
        "comment_count": 56,
        "days_ago": 5,
    },
    {
        "id": "p-webdev-3",
        "community_id": "c3",
        "author_id": "u-seed-vinyl",
        "title": "FastAPI + SQLAlchemy async patterns that scale",
        "content": "Thin routes, service layer, explicit session per request. Keep it boring.",
        "score": 388,
        "comment_count": 27,
        "days_ago": 7,
    },
    {
        "id": "p-webdev-4",
        "community_id": "c3",
        "author_id": "u-seed-css",
        "title": "Tailwind v4 migration notes",
        "content": "CSS-first config is growing on me. Anyone else moved a production app yet?",
        "score": 145,
        "comment_count": 19,
        "days_ago": 10,
    },
]


def _created_at(days_ago: int) -> datetime:
    return datetime.now(UTC).replace(tzinfo=None) - timedelta(days=days_ago)


async def seed() -> None:
    async with async_session_factory() as session:
        existing = await session.execute(
            select(Community).where(Community.name == SEED_MARKER_COMMUNITY)
        )
        if existing.scalar_one_or_none() is not None:
            print("Content seed data already present - skipping.")
            return

        for community_data in SEED_COMMUNITIES:
            session.add(
                Community(
                    id=community_data["id"],
                    name=community_data["name"],
                    display_name=community_data["display_name"],
                    description=community_data["description"],
                    icon_url=community_data["icon_url"],
                    banner_url=community_data["banner_url"],
                    creator_id=community_data["creator_id"],
                    member_count=community_data["member_count"],
                    created_at=_created_at(60),
                )
            )
            session.add(
                CommunityMembership(
                    user_id=community_data["creator_id"],
                    community_id=community_data["id"],
                    role="member",
                    joined_at=_created_at(60),
                )
            )

        for raw_post in SEED_POSTS:
            author_username = SEED_AUTHORS[raw_post["author_id"]]
            session.add(
                Post(
                    id=raw_post["id"],
                    community_id=raw_post["community_id"],
                    author_id=raw_post["author_id"],
                    author_username=author_username,
                    title=raw_post["title"],
                    content=raw_post["content"],
                    score=raw_post["score"],
                    comment_count=raw_post["comment_count"],
                    post_type="text",
                    created_at=_created_at(raw_post["days_ago"]),
                )
            )

        await session.commit()
        print(
            f"Seeded {len(SEED_COMMUNITIES)} communities and {len(SEED_POSTS)} posts into content_db."
        )


def main() -> None:
    asyncio.run(seed())


if __name__ == "__main__":
    main()
