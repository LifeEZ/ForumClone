# Frontend context

Supplement to the shared glossary in [`CONTEXT.md`](../CONTEXT.md).

## Data-fetching pattern

Page views follow an **API-first** pattern (established in slice 4):

| Concern | Source |
|---------|--------|
| Auth session | `useAuth()` from `AuthContext` |
| HTTP | `lib/api.ts` |
| API → UI types | `lib/mappers.ts` |
| Loading / errors | Local `useState` in the view |

`CreateCommunityView`, `CommunityView`, `HomeView`, and `PostDetailView` load their own data this way.

## AppContext (shell only)

`AppContext` is **not** the default data layer. It remains for:

- **Shell chrome** — `Navbar`, `LeftSidebar`, `RightSidebar`, `CommunitiesStrip` share a communities cache and join toggles from the sidebar.
- **Stale stubs** — mock comments, stub `addPost` / `votePost` until later slices wire the backend.

Page views should not read communities or membership from `AppContext` when they can call `api.ts` directly. After a page-level join/leave, call `refreshCommunities()` so shell chrome stays in sync.

## Cleanup backlog

| Area | When | Action |
|------|------|--------|
| **Comments** | Slice 6 | Remove `mockComments` from `AppContext`; `PostDetailView` and `CommentThread` should fetch/create via `api.ts` (same pattern as posts). |
| **Create post** | Slice 5 | `SubmitPostView` should use `api.ts`, not `addPost` stub. |
| **Votes** | Slice 7 | Replace per-view optimistic vote state + `votePost` / `voteComment` stubs with API calls. |
| **AppContext** | After slices 5–7 | Shrink or delete once shell chrome has a narrower hook (e.g. `useCommunities`). |
