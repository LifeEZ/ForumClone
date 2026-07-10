# Karma shown on the logged-in user's nav only — not next to every author

Journey 8 in `PLAN-v1.md` says "live karma shown next to usernames," and the plan's Rules table previously said karma is "displayed on posts/comments only (no profile page)." We are overriding both for v1: **karma is shown only for the logged-in user (in the nav/header), not next to every post and comment author.**

ADR-0002 deliberately dropped author karma from Content — migration `002_drop_author_karma` removed it, and `mapApiUserPublic` carries no karma. The author snapshot on posts/comments is `username` + `avatar_url` only. Showing karma next to *every* post/comment author would force one of three things, all bad for v1: a cross-service lookup per page (a batch Identity call for the page's distinct author ids — exactly the hot-path coupling ADR-0002 avoids, just deferred to read time); re-snapshotting karma onto posts/comments at write time (re-introduces what migration 002 removed, and goes stale the moment any vote lands); or an author-karma cache (new infra). The logged-in user's own karma, by contrast, is already on `/users/me` and updates eventually as the relay drains the outbox.

**Considered options**

| Option | Why not (for v1) |
|--------|---------|
| Batch Identity lookup per page for author karma | Cross-service read coupling on every feed/detail render; defeats ADR-0002's separation; adds latency and a failure surface to the read path |
| Re-snapshot karma onto posts/comments at write time | Reverts migration 002; goes stale immediately since karma changes on every vote received; the staleness is the whole problem |
| Cached author-karma projection in Content | New infra (a karma cache table + invalidation on vote event) for a demo nicety |

**Consequences**

- v1 UI shows karma in one place: the logged-in user's nav. Post and comment authors show username (+ avatar) only.
- The plan's Rules table and journey 8 wording are updated to match: karma is nav-only in v1.
- `User.karma` still updates correctly in Identity via the outbox/relay (ADR-0003), so when v2 wants author karma (e.g. via a batch lookup or a projected cache) the data is already live and correct — only the display decision changes.
- No `CONTEXT.md` change: the glossary defines Karma as "a user's accumulated standing … derived from votes received" — that is still true; this ADR is about *where it is displayed*, which is an implementation/product-scope decision, not a domain term.
