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

Page views should not read communities or membership from `AppContext` when they can call `api.ts` directly. After a page-level join/leave, call `refreshCommunities()` so shell chrome stays in sync.

## Slice cleanup status

Slices 5–7 wired comments, post creation, and votes through `api.ts`; the per-view
state lives in the views themselves (`PostDetailView`, `SubmitPostView`, `VoteControl`).
`mockComments`, the `addPost` stub, and the `votePost` stub were removed from
`AppContext` as part of slice 8 polish — `AppContext` now exposes only communities
cache + join toggles.

| Area | Slice | Status |
|------|------|--------|
| Comments | 6 | ✅ `PostDetailView` / `CommentThread` fetch + create via `api.ts`; `mockComments` removed |
| Create post | 5 | ✅ `SubmitPostView` uses `api.ts`; `addPost` stub removed |
| Votes | 7 | ✅ `VoteControl` calls `api.castVote`; `votePost` stub removed |
| AppContext shape | After 5–7 | ✅ Shell-only (communities cache + `toggleJoinCommunity`); no data stubs remain |
