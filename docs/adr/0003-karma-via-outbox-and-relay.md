# Karma via outbox + in-process relay + Identity internal endpoint

Slice 7 adds voting. `score` (per-item, in Content) is immediate and is the number users actually watch. `karma` (per-user, in Identity) must update when votes change — but the author whose karma changes is owned by Identity, not Content. ADR-0002 already committed to eventual consistency: *"Content keeps per-item `score` locally and emits a 'vote-applied' event (outbox) that Identity consumes to update `user.karma`."* This ADR pins down *how* the event travels, within that constraint.

When a vote mutation lands in Content, the same transaction writes one row to an `outbox` table in `content_db` carrying `event_id`, `recipient_user_id` (the target's `author_id`), `delta = new_value - old_value`, `target_type`, `target_id`, `voter_user_id`, and timestamps. A relay runs as an **asyncio background task started in Content's lifespan**: it polls the outbox every ~2s in batches, POSTs each event to Identity's `POST /internal/karma` with a shared-static-secret header (`HIVER_INTERNAL_TOKEN`), and marks `dispatched_at` on 2xx. Identity applies `karma += delta` inside a transaction that first inserts `event_id` into a `processed_events` dedup table; a duplicate insert means the event was already applied, and Identity returns 200 anyway so the relay marks it dispatched. Karma is unbounded (can go negative); seed users receive deltas like any other author.

**Considered options**

| Option | Why not |
|--------|---------|
| Content POSTs to Identity synchronously after commit (no outbox) | Breaks ADR-0002's "no live call on the hot path"; couples the vote write's latency/availability to Identity; a vote should never fail because Identity is down |
| Identity polls a Content outbox endpoint and applies deltas itself | Inverts ownership — Identity reaches into Content's data model; Content can't evolve the outbox schema freely; also makes Content expose an internal read API it otherwise doesn't need |
| Kafka / a real broker | Oversized for one karma event and won't run on free tiers (same reasoning as ADR-0002) |
| Separate worker process for the relay | Closer to prod, but adds a fourth deployable / cold-start surface for a demo; an in-process task is enough at this scale and trivial to split out later |
| At-least-once without a dedup table | A relay crash mid-POST or a redelivery double-counts karma permanently; the dedup table is cheap and removes that risk |

**Consequences**

- Two new tables: `outbox` in `content_db`, `processed_events` in `identity_db`. One new migration per service. (The `votes` table already exists from migration 001.)
- Karma is eventually consistent and may briefly lag a vote; `score` is always immediate. Acceptable and already endorsed by ADR-0002.
- The relay lives inside the Content process, so a Content crash can stall karma delivery until restart — but undelivered events remain in the outbox and drain on next start. No event is lost.
- At-least-once delivery + `event_id` dedup means Identity must be able to see the same `event_id` twice; the dedup insert is the apply gate.
- A shared static secret guards `POST /internal/karma`. It is not a user token; it is a service-to-service credential distributed via env on both services. Rotating it is a deploy-time concern.
- The outbox grows with every vote mutation (rows are marked dispatched, not deleted) — an audit log. A future retention sweep is a v2 concern; at demo scale it is negligible.
