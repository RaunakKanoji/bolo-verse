# Realtime and consistency

There is no deployed project-presence or realtime editing service in the current foundation. The `ws` dependency supports the Neon PostgreSQL connection path; its presence does not mean collaborative WebSocket sessions exist.

Current durable state is server-authoritative. Private drafts, legacy XR layouts and canonical scenes use explicit optimistic revisions. Conflicting writes fail rather than silently overwrite another saved version; clients retain local edits and offer an explicit reload/retry path. These independently persisted formats are not automatically synchronized.

Phase 1 retains this model while establishing package and build boundaries. It adds neither an empty `apps/realtime` service nor a CRDT dependency.

## Planned collaboration slice

Keep these responsibilities separate:

| State | Persistence and authority |
| --- | --- |
| Project metadata, assets, saved scenes, comments, deliverables | PostgreSQL; authorized application services own mutations |
| Presence, cursor, active selection | Ephemeral, expiring project-scoped sessions; never the permission source |
| Editing proposals and committed events | Validated operation contracts, expected revision and idempotency identity |

The first realtime increment should add authenticated project presence and notifications of committed revisions. A client reconnects by fetching the authorized snapshot before applying newer events. Duplicate, missing and reordered events must not corrupt durable state. Membership revocation must terminate subscriptions and prevent further mutations.

Use a managed provider or separate persistent runtime only when an actual connection/deployment requirement justifies it. Do not assume ordinary Next.js serverless route handlers provide a durable WebSocket host. Keep project authorization and mutation services in the modular backend.

CRDT adoption is a later evaluated choice for specific concurrent editing data. A decision must define document identity, schema evolution, persistence/snapshots, reconnect/compaction, authorization and conflict semantics. Do not replace all relational or approval operations with last-write-wins updates, and do not treat presence messages as saved scene changes.

Acceptance requires tests for revoked users, unauthorized project subscriptions, concurrent edits, duplicate/reordered events, interrupted connections and recovery from the saved revision. No such live provider or reconnect behavior is claimed by the current CAS APIs.
