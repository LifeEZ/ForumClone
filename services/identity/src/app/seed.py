"""Load demo seed users into identity_db.

Run after migrations:
    uv run python -m app.seed
"""

import asyncio

from sqlalchemy import select

from app.database import async_session_factory
from app.models.user import User
from app.services.auth import hash_password

SEED_USERS = [
    {
        "id": "u-seed-cinema",
        "username": "cinema_fan",
        "email": "cinema_fan@seed.hiver",
        "karma": 128,
    },
    {
        "id": "u-seed-vinyl",
        "username": "vinyl_head",
        "email": "vinyl_head@seed.hiver",
        "karma": 890,
    },
    {"id": "u-seed-css", "username": "css_wizard", "email": "css_wizard@seed.hiver", "karma": 456},
]


async def seed() -> None:
    async with async_session_factory() as session:
        existing = await session.execute(select(User).where(User.id == SEED_USERS[0]["id"]))
        if existing.scalar_one_or_none() is not None:
            print("Identity seed data already present - skipping.")
            return

        unusable_hash = hash_password("seed-not-login-able")
        for user_data in SEED_USERS:
            session.add(
                User(
                    id=user_data["id"],
                    username=user_data["username"],
                    email=user_data["email"],
                    password_hash=unusable_hash,
                    karma=user_data["karma"],
                    is_active=False,
                )
            )
        await session.commit()
        print(f"Seeded {len(SEED_USERS)} users into identity_db.")


def main() -> None:
    asyncio.run(seed())


if __name__ == "__main__":
    main()
