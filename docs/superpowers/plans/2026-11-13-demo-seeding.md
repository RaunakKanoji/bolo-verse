# Demo seeding implementation plan

Goal: deliver a reproducible, interconnected presentation dataset and an accessible Vercel-safe walkthrough without requiring Clerk setup (user explicitly deferred Clerk).

Audit: Next 16 App Router, strict TS, pnpm, Neon/Drizzle; existing projects, workspace_clients, tasks, brief_versions, artifact_versions, brainstorm sessions/messages/ideas, content_versions, assets, immutable reviews, command_logs and xr_workspaces cover the requested domains. No organization/profile administration exists. Current asset storage is localhost-only SeaweedFS. Live provider and Clerk configuration is incomplete. Existing dirty feature work must remain intact.

Approach: reuse current database models in an isolated PGlite development database. Stable UUIDs and transaction-scoped inserts; collisions abort, reruns preserve edits. Export a public synthetic snapshot for /demo, separate from all private APIs. No fake Clerk users or sessions, external notifications, storage writes or billable requests. Bundled allowlisted synthetic PNG fixtures support the existing authorized asset readers. Status detail unsupported by current enums stays in explicitly labelled production notes; strict wire contracts remain unchanged.

Reset archives only stamped seed projects, preserving immutable feedback and user edits; --confirm=<workspace slug> required. Seed reruns do not unarchive. An explicitly selected fresh slug creates another dataset. Hosted seeding fails closed without a verified development account and exact approved endpoint; currently deferred.

- [x] Test guards, deterministic counts, links, dates, script/storyboard alignment and fixture bytes.
- [x] Implement dataset, strict validation, generated original fixtures and modular seed runner.
- [x] Run migrations and seed twice in dedicated local database; prove rollback, isolation, persistence and scoped reset.
- [x] Implement responsive read-only /demo dashboard, project details, creative workflow and XR handoff using the exported snapshot.
- [x] Run pnpm check and representative production browser flows; document actual counts, setup, presentation sequence and remaining gates.

Review focus: production target rejection; collisions never adopted; seed reruns preserve edits; no queued synthetic work can execute; public snapshot contains only fictional data; all assets are locally accessible; immutable review history remains intact.

Result: 14 workspace tasks, 848 tests/98 files, both builds and 48 production Chromium cases passed. 35 fixture URLs match actual hashes; seed twice inserted no duplicates. No remote write, commit/push, deployment or physical device acceptance. See [delivery guide](../../demo-seeding.md).
