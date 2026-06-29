# Split the monolith into Gateway + Identity + Content services

Hiver was built as a single FastAPI app over one Postgres database. We want a clean distributed-system design — service boundaries, stateless cross-service auth, per-service data ownership, and eventual consistency — without inventing complexity the product doesn't need.

The build is stopped cleanly at the **end of slice 2**: auth and all read feeds are done, but every remaining slice (join/leave, create community, create post, comments, votes/karma) is a cross-domain *write* path. Those writes are exactly the coupling a split has to undo (foreign keys into `users`, and a vote that updates both an item's `score` and a user's `karma` in one transaction). Splitting **now** means we build the remaining slices service-first and never write that coupling.

We split along the one clean seam — identity vs content — into a **Gateway**, an **Identity** service (`users`, `refresh_tokens`, `karma`), and a **Content** service (`communities`, `memberships`, `posts`, `comments`, `votes`), each with its own database, in a monorepo (`services/{identity,content,gateway}`).

To make services independent we change three things from [ADR-0001](./0001-jwt-access-and-refresh-tokens.md): JWTs move from **HS256 (shared secret) to RS256 (Identity signs with a private key; Gateway and Content verify with the public key)**; the access token now carries the `username` claim so Content authenticates requests from the token alone with **no database lookup**; and Content drops foreign keys into `users`, instead storing the author's id and a **denormalized `author_username` snapshot** copied from the token at write time. Karma becomes **eventually consistent** — Content keeps per-item `score` locally and emits a "vote-applied" event (outbox) that Identity consumes to update `user.karma`.

**Considered options**

| Option | Why not |
|--------|---------|
| Stay a monolith | Valid and simpler, but doesn't deliver the independent-service architecture this project targets |
| Finish v1 as a monolith, then split | Builds the cross-domain coupling (FKs, vote→karma transaction) only to tear it out; wasted work |
| Full per-domain split (separate community / posts / comments / votes services) | Introduces distributed transactions / sagas across content for no demo benefit at this scale |
| Kafka for events | Oversized for one karma event and won't run on free tiers; outbox table suffices |
| Nginx / GraphQL | Gateway already proxies; GraphQL is an unrelated API-style rewrite |

**Consequences**

- Three deployables (gateway + 2 services) and two databases (`identity_db`, `content_db`); seed populates both. Three cold-start surfaces on free tiers — acceptable for a demo.
- Auth is stateless across services; rotating the signing key is a deploy-time concern (publish new public key before old tokens are issued against the new private key).
- The `author_username` snapshot can go stale if a user renames; v1 has no rename, so this is deferred (a future event from Identity would refresh snapshots).
- Karma is eventually consistent — it may briefly lag a vote. Acceptable; `score` (the per-item number users actually watch) is always immediate.
- Redis is added solely for gateway rate limiting; it is the one deliberate piece of extra infrastructure and has a concrete job.
