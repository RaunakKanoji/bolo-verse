# Domain model

The modular backend now has 24 tables. The original [Drizzle schema](../../apps/web/src/server/db/schema.ts) is extended by [creation tables](../../apps/web/src/server/db/creation-schema.ts), with checked-in migrations `0000–0008`. The initial connected creative milestone adds upload sessions and image request metadata to existing assets/jobs; it does not introduce parallel asset or job tables.

| Responsibility | Implemented tables |
| --- | --- |
| Personal workspace ownership | `workspaces`, `workspace_members` |
| Project identity and roles | `projects`, `project_members` |
| Private creator drafts | `creative_drafts` |
| Versioned briefs and creative artifacts | `brief_versions`, `artifact_versions` |
| Recording session lifecycle | `studio_sessions` |
| Stored asset metadata and product references | `assets`, `products` |
| Canonical, recording and legacy browser scenes | `spatial_scenes`, `scene_state`, `xr_workspaces` |
| Output versions | `content_versions` |
| Review feedback and immutable decisions | `review_comments`, `review_decisions` |
| Scoped access grants | `access_grants` |
| Command records and claim checks | `command_logs`, `claim_checks` |
| Processing lifecycle and upload events | `processing_jobs`, `upload_events` |
| Private image upload reservations and cleanup state | `asset_upload_sessions` |
| Private image request provenance and cleanup state | `image_generation_requests` |
| Durable request budgets | `rate_limit_buckets` |

Clerk owns account identity; persisted subjects are text, while application resources generally use UUIDs. There is no local `users` or Clerk Organizations administration table. A personal workspace has one `personal_owner_clerk_id`; it must not be relabelled as a full organization model.

Projects inherit workspace ownership and may grant explicit `creator`, `editor` or `client` membership. Workspace owners and project creators/editors can edit; explicit project members can read. Ordinary workspace membership alone does not expose every project. [SQL authorization predicates](../../apps/web/src/server/db/projects.ts) enforce these rules on the server.

Project-scoped composite foreign keys prevent cross-project references between briefs, artifacts, assets and outputs. Drafts additionally belong to one Clerk subject within the project. Review decisions reject UPDATE/DELETE through migration 0004; append new decisions to preserve history.

Canonical scenes use revision-checked writes and ready assets from the same project. Their schema version is independent of the database revision. See [scene format](scene-format.md) for the distinction from existing browser and recording layouts.

Schema presence is not feature completion. Image jobs now have a real authorized provider/storage worker and image uploads have verified immutable finalization. These additions do not implement video/audio/3D generation, billing reconciliation, content-version publication or a complete client portal. See the [connected creative status](../development/creative-foundation-status.md). The current functional repositories are under `apps/web/src/server/db`; application orchestration is extracted into focused services where needed, such as `apps/web/src/server/xr-assistant/service.ts`.

The development [seed command](../../scripts/seed.ts) explicitly resolves an existing Clerk account before creating a labelled fictional project, proposed brief and draft artifacts. Normal startup does not insert synthetic client approvals, generated assets or sample projects.

Later domain slices may add organizations/invitations, profile projections, tasks, durable conversations, asset derivatives, scene history, deliverables and notifications. Each addition needs an owner, lifecycle, authorized service, migration and PostgreSQL isolation tests. Do not create duplicate or empty tables merely to match the target architecture's noun list.
