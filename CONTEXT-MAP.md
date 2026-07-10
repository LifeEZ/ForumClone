# Context map

Hiver is a multi-service monorepo. Domain language is split between a shared glossary and per-package supplements.

## Shared glossary

| Path | Scope |
|------|-------|
| [`CONTEXT.md`](CONTEXT.md) | Canonical terms used across the whole product (Community, Member, Post, Vote, Karma, Feed, …) |

## Per-package supplements

Service-unique terms only — not duplicates of the shared glossary. Created lazily when a package accrues its own vocabulary.

| Path | Scope |
|------|-------|
| [`services/content/CONTEXT.md`](services/content/CONTEXT.md) | Content-service terms (Membership, …) |
| `services/identity/CONTEXT.md` | *(not yet — created when Identity-specific terms arise)* |
| `services/gateway/CONTEXT.md` | *(not yet — created when Gateway-specific terms arise)* |
| `frontend/CONTEXT.md` | Frontend data-fetching pattern, AppContext scope, cleanup backlog |

## Architecture decisions

| Path | Scope |
|------|-------|
| [`docs/adr/`](docs/adr/) | System-wide ADRs (auth, microservices split, …) |
