# Hiver v1 Plan

Portfolio-ready community platform. Domain language: [`CONTEXT.md`](../CONTEXT.md).

## Goal

- **Primary:** Full-stack product reviewers can click through end-to-end.
- **Secondary (light D):** Tests, CI, migrations, documented setup, live deploy on free tiers.

## Product

| Item | Decision |
|------|----------|
| Name | **Hiver** — community discussion platform |
| URLs | `/` home · `/c/{name}` community · `/c/{name}/posts/{id}` post |
| UI | Reddit-inspired 3-column layout, shadcn/ui, **dark mode default**, dark green\forest colors |
| Audience | Portfolio demo — explicit naming (`/c/` = community), not competing with Reddit |

## v1 journeys (must work)

1. **Guest read** — browse global feed, community pages, posts, and comments without an account
2. **Auth** — sign up, log in, log out; JWT access + refresh tokens ([ADR-0001](./adr/0001-jwt-access-and-refresh-tokens.md))
3. **Home feed** — logged-in members see posts from joined communities; global feed fallback + personalization banner when no joins
4. **Join / leave** community
5. **Create community** — any logged-in user; creator auto-joins as first member
6. **Create text post** — title + optional body; **must be a member** of the community
7. **Comments** — comment and nested reply, up to **10 levels** deep
8. **Votes** — upvote/downvote posts and comments; **live karma** shown next to usernames
9. **Delete** — author deletes own post/comment → `[deleted]` placeholder; thread structure preserved

## Deferred to v2

- Link and image posts
- User profile pages
- Feed sorting (hot / top)
- Search
- Moderation tools (lock, mod roles)
- Email verification, password reset, OAuth

## Rules

| Area | Rule |
|------|------|
| Access | Public read; auth required for vote, comment, post, join, create community |
| Feeds | Guests → global; members → home (joined only); **newest-first** everywhere |
| Membership | Required to post in a community |
| Karma | Updated when votes change; displayed on posts/comments only (no profile page) |
| Comments | Max depth 10; visual indent caps ~4 levels in UI |

## Seed content

Loaded for demo; not login-able.

| Item | Value |
|------|-------|
| Communities | `films`, `music`, `webdev` |
| Posts | ~4 per community |
| Comments | 1–2 threads on one post |
| Authors | 3 display-only seed users |

## Engineering (light D)

**In v1**

- API integration tests (pytest + httpx) per must-have journey
- GitHub Actions: `ruff` + `pytest` on push
- Alembic migrations for all schema changes
- `.env.example` + README (local setup + deploy)
- FastAPI `/docs`

**Out of v1**

- Playwright E2E
- Sentry
- mypy in CI

## Deploy (final step — free tiers only)

| Layer | Platform |
|-------|----------|
| Frontend | Vercel (Hobby) |
| API | Railway or Fly.io |
| Database | Neon Postgres |

Run after v1 works locally. Seed script runs on deploy or via one-off command. Cold starts after idle time are acceptable.

## Build order (vertical slices)

Each slice ships API + UI + tests before moving on.

| # | Slice | Demo milestone |
|---|-------|----------------|
| 1 | Auth (register, login, logout, refresh) | Account works |
| 2 | Read feeds (global, community, post detail) + seed script v0 | App looks alive |
| 3 | Join / leave + home feed logic | Personalization works |
| 4 | Create community | New `/c/...` exists |
| 5 | Create text post | User publishes content |
| 6 | Comments + replies | Threads work |
| 7 | Votes + karma | Engagement works |
| 8 | CI, seed polish, README | Production-shaped |
| 9 | Deploy | Live URL |

## Frontend routes

| Route | Purpose |
|-------|---------|
| `/` | Home (global or personalized) |
| `/c/[name]` | Community feed + join |
| `/c/[name]/posts/[id]` | Post + comment thread |
| `/login`, `/register` | Auth |
| `/create-community` | New community |
| `/c/[name]/submit` | New text post |

## Auth detail (v1)

| In | Out |
|----|-----|
| Email + password + username sign-up | Email verification |
| JWT access token (15 min) | Password reset |
| Refresh token (7 days, DB-stored, revocable) | OAuth |

See [ADR-0001](./adr/0001-jwt-access-and-refresh-tokens.md).
