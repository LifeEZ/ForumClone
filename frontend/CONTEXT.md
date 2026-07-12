# Frontend context

Supplement to the shared glossary in [`CONTEXT.md`](../CONTEXT.md).

## Data-fetching pattern

Page views follow an **API-first** pattern (established in slice 4, cache moved to React Query per ADR-0005):

| Concern | Source |
|---------|--------|
| Auth session | `useAuth()` from `AuthContext` (thin wrapper over `useQuery(['me'])`) |
| HTTP transport (token refresh on 401, error mapping) | `lib/api.ts` |
| Client-side cache, loading/errors, invalidation, refetch, transient retry (429/5xx) | React Query via hooks in `lib/hooks/` |
| Token storage | `lib/tokenService.ts` singleton |
| API → UI types | `lib/mappers.ts` |

`CreateCommunityView`, `CommunityView`, `HomeView`, `PostDetailView`, and `SubmitPostView` each call a hook from `lib/hooks/` rather than touching `api.ts` directly. The shell components (`Navbar`, `LeftSidebar`, `RightSidebar`, `CommunitiesStrip`) likewise call hooks; there is no separate shell cache layer. See ADR-0005 for the transport-owns-success / RQ-owns-recency split.

## Token layer

**Access Token**:
Short-lived credential attached to each authenticated HTTP request. Held in `TokenService`; read by `api.ts` on every request; set by `AuthContext` after login/register.
_Avoid_: bearer, JWT (implementation detail)

**Refresh Token**:
Long-lived credential used only inside `api.ts` to mint a new Access Token after a 401. Held in `TokenService`; read by `api.ts` only during 401 recovery.
_Avoid_: session token, refresh credential

**SessionExpiredError**:
Thrown by `api.ts` when an Access Token refresh attempt itself fails with 401. Treated as terminal by the frontend: the global React Query error handler calls `AuthContext.logout()` and clears the query cache. Distinct from `ApiError` (status 401), which fires per-request and is eligible for refresh.
_Avoid_: auth error, unauthorised (too generic)
