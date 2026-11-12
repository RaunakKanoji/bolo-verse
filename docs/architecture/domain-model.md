# Domain model

Phase 1 preserves the existing modular backend and 22-table schema. The source of truth is [Drizzle schema](../../src/server/db/schema.ts), with checked-in migrations `0000–0005`. Workspace packaging does not require a new database migration.

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
| Durable request budgets | `rate_limit_buckets` |

Clerk owns account identity; persisted subjects are text, while application resources generally use UUIDs. There is no local `users` or Clerk Organizations administration table. A personal workspace has one `personal_owner_clerk_id`; it must not be relabelled as a full organization model.

Projects inherit workspace ownership and may grant explicit `creator`, `editor` or `client` membership. Workspace owners and project creators/editors can edit; explicit project members can read. Ordinary workspace membership alone does not expose every project. [SQL authorization predicates](../../src/server/db/projects.ts) enforce these rules on the server.

Project-scoped composite foreign keys prevent cross-project references between briefs, artifacts, assets and outputs. Drafts additionally belong to one Clerk subject within the project. Review decisions reject UPDATE/DELETE through migration 0004; append new decisions to preserve history.

Canonical scenes use revision-checked writes and ready assets from the same project. Their schema version is independent of the database revision. See [scene format](scene-format.md) for the distinction from existing browser and recording layouts.

Schema presence is not feature completion. Processing-job and review records do not establish a media-generation worker, a complete client portal or upload-finalization workflow. The current functional repositories are under `src/server/db`; application orchestration is extracted into focused services where needed, such as `src/server/xr-assistant/service.ts`.

The development [seed command](../../scripts/seed.ts) explicitly resolves an existing Clerk account before creating a labelled fictional project, proposed brief and draft artifacts. Normal startup does not insert synthetic client approvals, generated assets or sample projects.

Later domain slices may add organizations/invitations, profile projections, tasks, durable conversations, asset derivatives, scene history, deliverables and notifications. Each addition needs an owner, lifecycle, authorized service, migration and PostgreSQL isolation tests. Do not create duplicate or empty tables merely to match the target architecture's noun list.
