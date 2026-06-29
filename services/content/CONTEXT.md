# Content service

Supplement to the shared glossary in [`CONTEXT.md`](../../CONTEXT.md). Terms here are unique to the Content bounded context.

## Language

**Membership**:
The link between a User and a Community they have joined. Stored in Content as `(user_id, community_id)` — the user lives in Identity (no foreign key). Membership is what makes a user a Member of a community.
_Avoid_: subscription, follow
