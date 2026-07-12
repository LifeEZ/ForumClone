# React Query migration plan

Frontend adoption of React Query, per [ADR-0005](./adr/0005-react-query-owns-cache-not-transport.md). Branch: `feat/react-query-migration`.


## Slice 0 — foundation

No views touched yet.

1. **`lib/tokenService.ts`** (new): module-level singleton (in-memory + localStorage rehydration on import). Exposes `getAccessToken()`, `getRefreshToken()`, `set(tokens)`, `clear()`, `hasAccessToken()`.
2. **Refactor `lib/api.ts`** to read tokens via `TokenService` instead of `getStoredTokens()`. Delete the four `*StoredTokens` exports. Remove `fetchWithRetry` (RQ owns transient retry now). Keep `requestWithAuth`, `refreshInFlight`, `SessionExpiredError`, `ApiError`.
3. **`lib/queryClient.ts`** (new): `makeQueryClient()` factory. Defaults: `queries.retry: (failureCount, error) => transient && failureCount < 3`, `queries.retryDelay: exponential`, `queries.staleTime: 0`, `refetchOnWindowFocus: true`. `mutations.retry: false`.
4. **`lib/invalidations.ts`** (new): exported helpers, e.g. `communityMembership(qc, name)`, `postVote(qc, postId)`. One map per mutation family.
5. **`QueryClientProvider.tsx`** (new, client component): instantiates `makeQueryClient()` once via `useState`; reads `logout` from `useAuth()`; binds `QueryCache.onError` and `MutationCache.onError` to call `logout()` + `queryClient.clear()` on `SessionExpiredError`. Mounted as a child of `AuthProvider`.
6. **`lib/hooks/`** (new dir): one file per query/mutation family. `useCommunities.ts`, `useCommunity.ts`, `usePost.ts`, `useComments.ts`, `useVote.ts`, `useCommunityMembership.ts`, `useAuthMutations.ts`. Each wraps the matching `lib/api.ts` function with the right `staleTime`.

## Slice 1 — tracer bullet: HomeView

The hard view: conditional branches + optimistic vote rollback.

7. Wire `QueryClientProvider` into `app/layout.tsx` between `AuthProvider` and `AppProvider` (AppProvider is removed in slice 3 — temporary coexistence).
8. Convert `AuthContext` to `useQuery(['me'], fetchCurrentUser, { enabled: !!TokenService.hasAccessToken() })`. `login`/`register` call `TokenService.set(tokens)` + `queryClient.invalidateQueries(['me'])`. `logout` calls `TokenService.clear()` + `queryClient.clear()`. Delete `loadUserFromStorage` and its retry loop.
9. Migrate `HomeView.tsx`:
   - Three conditional queries: `['home', user?.id]` (authed, joinedCount > 0), `['posts','global']` (authed, joinedCount === 0, fallback + banner), `['posts','global-anon']` (unauthed). Each with `enabled` + `staleTime: 30_000`.
   - `joinedCount` from new `useCommunities()` hook (temporary `useAppContext()` shim until slice 3).
   - Vote via `useVote()` mutation with `onMutate` optimistic update + `onError` rollback (reddit pattern).
   - Banner logic derived during render, no effect.

## Slice 2 — replicate pattern

Order: easiest first, after the hard one is proven.

10. `CommunityView.tsx`: `useCommunity`, `useCommunityPosts`. Join/leave via `useCommunityMembership` → `invalidations.communityMembership(qc, name)`.
11. `PostDetailView.tsx`: `usePost`, `useComments`. `createComment` mutation → invalidate `['post', postId, 'comments']`.
12. `SubmitPostView.tsx`: `createPost` mutation → invalidate `['community', name, 'posts']` + `['home']`.
13. `CreateCommunityView.tsx`: `createCommunity` mutation → invalidate `['communities']`.
14. `AuthFormView.tsx`: replace direct `loginUser`/`registerUser` with `useLogin`/`useRegister`.

## Slice 3 — delete AppContext

15. Shell components (`Navbar`, `LeftSidebar`, `RightSidebar`, `CommunitiesStrip`) call `useCommunities()` + `useCommunityMembership()` directly.
16. Remove `AppContext.tsx`, `<AppProvider>` from `layout.tsx`, `useAppContext`. Remove the temporary shim from slice 1.

## Slice 4 — polish + verify

17. Run `npm run lint`, `npm run build`.
18. Manual smoke pass: login, F5, navigate tabs, cast vote (truncate access token in localStorage to force refresh), join/leave community to verify invalidation across sidebar + feed.
19. Update `docs/PLAN-v1.md` "Frontend conventions" (lines 138-142 are stale pre-ADR-0005).

## Verification risks

- **Infinite logout loop**: prevented by `queryClient.clear()` in the global error handler — no queries remain to re-trigger.
- **`enabled` ordering in HomeView**: gate home query on `communities !== undefined` so fallback branch can't fire before `joinedCount` is known.
- **Sidebar after logout**: `queryClient.clear()` wipes `['communities']` — verify the sidebar shows a loading state, not a broken empty page.
- **`onError` layering on vote**: `onError` on the mutation rolls back the optimistic vote; `MutationCache.onError` (global) fires after and triggers logout only if `SessionExpiredError`. Verify order via smoke test.
- **`Retry-After` header not honoured**: documented in ADR-0005 as a known consequence of moving retry to RQ.