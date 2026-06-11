# JWT access tokens with server-stored refresh tokens

Hiver splits into a Next.js frontend and a FastAPI API on separate hosts. We need authenticated sessions that survive tab closes, support logout/revocation, and work across that split without hitting a session store on every API call.

We use **short-lived JWT access tokens** (15 minutes, verified by signature) plus **long-lived refresh tokens** stored in Postgres (`refresh_tokens` table, 7-day expiry, revocable on logout). We rejected pure session cookies because they require a DB/Redis lookup on every authenticated request and fit less naturally when the browser app and API are separate services. We rejected fully stateless JWT-only auth because stolen access tokens would remain valid until expiry with no revocation path.

**Considered options**

| Option | Why not |
|--------|---------|
| Session cookies only | Simple, but every API call needs session store lookup; less natural for SPA + separate API |
| Stateless JWT only (no refresh) | No server-side revocation; long sessions mean long exposure window |
| OAuth (Google/GitHub) | Out of scope for v1 portfolio; adds integration work |

**Consequences**

- Access token sent as `Authorization: Bearer` from the frontend; refresh token exchanged at `POST /auth/refresh`.
- Logout revokes the refresh token row — forced re-login even if an old access token hasn't expired yet (until it expires naturally).
- Auth touches every write endpoint; changing approach later is costly — this ADR exists so that cost is explicit.
- v1 defers email verification, password reset, and OAuth.
