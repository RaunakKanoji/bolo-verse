# Immutable uploaded-image publication implementation plan

> **For agentic workers:** Inline execution with focused behavioral tests and independent review. Preserve the existing dirty workspace. No staging, commit, external mutation, live migration or deployment without authorization.

**Goal:** Explicitly publish verified private uploaded images as immutable reviewable content versions.

**Spec:** `context/feature-specs/06-deliverable-publication.md`.

## Implementation map / existing behavior

- `content_versions` already has project/version uniqueness, asset/brief project FKs and a ready-row UPDATE/DELETE rejection trigger. Reuse it: ready means published, not approved. A UUID idempotency key becomes the content-version ID; project row locking serializes max-version allocation across current content rows. No new table/migration/dependency.
- Existing legacy `OutputSourceSnapshotSchema` v1 remains byte-for-byte unchanged. Add `contracts/deliverables.ts` with a separate schemaVersion2 `uploaded_image` provenance contract. Store server-derived creator/project/asset SHA256, title/caption, optional actual same-project brief version and canonical scene revision explicitly contextual, never rendered provenance. Extend only the DB TypeScript union. Public projections omit creator identity/private keys.
- Restrict this uploaded-image slice to ready upload-session assets at exact server-owned final keys, valid hash/MIME/dimensions/size. Existing provider-generated assets remain separate; do not mislabel them as uploads. Re-read and validate bounded private bytes before a new publication, then reauthorize/recheck source inside a row-locked SQL transaction. Safe exact retries return the old immutable record without allocating another version.
- Add `server/db/deliverables.ts`, `server/services/deliverables.ts`, collection GET/POST and version-detail GET under `/api/v1/projects/[projectId]/deliverables`. Existing Clerk/Origin/strict bounded JSON/no-store error controls remain. Use a durable publication quota. Editor-only history/detail for now: publication creates no reviewer grant and makes no media public. Existing asset visibility is unchanged; review-grant issuance is later work.
- Add `features/projects/ProjectDeliverables.tsx` + CSS and reuse existing bounded `ImageThumbnail`/gallery private reads. Add Publish selected image dialog in the existing image library (title, caption, optional brief version/scene context) and a history list with actual preview/status/timestamp/detail. Session/role/project teardown aborts requests and clears private state; failed/lost replies keep form/idempotency key for explicit retry.
- Extend `ShapeApiSchemas/Operations` additively, regenerate OpenAPI/TS/Swift/native copies and add cross-language fixtures. No scene v1 change or Swift UI feature.
- Extend tests with strict provenance/legacy compatibility, PGlite publication/CAS/idempotency/immutability/permissions/storage races, and isolated gallery/history browser flows. Add a test-only HTTP harness entry, preserving existing uploads and browser fixtures.
- Update both trackers and `docs/development/deliverable-publication-status.md` with exact files/API/security/evidence/manual demo/limits/staging.

## Review focus

- Retry after lost response or later publications must return exactly one old version; changed actor/project/payload/key reuse must conflict.
- Missing/non-ready/foreign/generated/mutated source or revoked editor during R2 latency must never publish.
- Legacy v1 snapshots, decisions and ready bytes remain immutable; new provenance cannot claim a canonical render.
- A scene revision is accepted only if it is the current actual canonical revision; optional brief resolves a real same-project row, not client metadata.
- UI cancellation/session switch/role downgrade discards late results; failed submit retains inputs/key. History publication grants no reviewer access.

## Task 1 — contracts and publication boundary

- [x] Write failing contract/SQL tests for uploaded provenance versus unchanged legacy schemas, ready source/media verification, concurrent publication and duplicate/change-key retries, foreign IDs/roles, deleted object, source hash, brief/scene links and DB immutability.
- [x] Implement strict separately versioned schemas, repository/service and authorized collection/detail routes. Reuse bounded reads, full image verification and existing immutable content rows; no migration.
- [x] Add schemas/operations to registry, regenerate deterministic TS/OpenAPI/Swift/native artifacts and fixtures.
- [x] Run focused contract/SQL tests and generated drift checks.

## Task 2 — explicit publication and history

- [x] Add failing browser cases for selected-image preview/dialog, title validation, explicit Publish, reloaded history/bytes, pending/network retry, no implicit upload publication, readonly/denied access, context provenance and teardown.
- [x] Add session-owned publication dialog/history through existing project image selection. Retain a UUID across exact retries, change it only for changed form/source or explicit new publication. Show Uploaded image and Published; do not infer review or approval state.
- [x] Run gallery/publication browser flows and inspect desktop/mobile screenshots.

## Task 3 — acceptance

- [x] Independent scoped code/security review; regressions for material findings.
- [x] Run pnpm check, full Chromium, Swift roundtrip/native tests and checked-in unsigned generic visionOS Simulator project compilation for generated Swift additions. Record compilation versus physical verification accurately.
- [x] Record PASS/FAIL/NOT RUN, exact changes/API/security/manual 90-second demo and suggested staging/commit. Live Clerk/Neon/R2 creator acceptance remains NOT RUN if configuration is absent. Stop at Feature06.

## Execution ledger

- Task 1 complete: missing contracts/routes first failed; 72 focused tests in three files passed after implementation and review fixes. Exact retry, concurrent versions, ready upload/source-byte identity, source links, quota, identity/Origin/body limits and content/asset/decision immutability verified. Legacy v1 accepted unchanged. No migration needed.
- Task 2 complete: six publication plus nine existing gallery browser cases passed. Native dialog, real PNG fixture previews, explicit publish, reload/history, retained form/key, contextual scene notice, access loss and cancel/sign-out teardown verified. Shared thumbnail extracted to avoid circular imports; no renderer changes.
- Review finding fixed: canonical scene SELECT initially allowed a save between check and commit. FOR SHARE now holds the context row through commit; actual SQL regression RED→GREEN. Initial root PGlite query spy missed transaction-local SQL; corrected to actual Drizzle logging. PGlite serializes transactions; no live two-connection interleaving is claimed.
- Review finding fixed: finishing another image upload could auto-select/remount and discard the publication form. Delayed-upload regression RED→GREEN; publication now waits for upload/catalog work. Existing native modal prevents starting new underlying UI actions while the dialog is open.
- Scope decision: remove proposed hardcoded reviewStatus; publication is Published and grants/approves nothing. Current client history/detail remains editor-only; grant issuance is later work. Reject provider-generated assets instead of mislabelling them uploaded.
- Task 3 complete: final pnpm check passed14 tasks,613 tests/63 files and both builds; full Chromium108 tests/15 files; Swift25 roundtrips/nine invalids; native48 core tests; unsigned generic visionOS Simulator project compilation passed. Desktop/mobile screenshots and final whitespace/staging checks passed.
- Live gate NOT RUN: Clerk/database/private R2 configuration/accounts and real source absent. No storage write/provider call/cloud provisioning/live migration/deployment/staging/commit/push. Earlier dirty Features00–05 preserved. Native publication UI/physical verification not implemented or claimed.
- Exact evidence/API/security/paths/manual QA/staging: docs/development/deliverable-publication-status.md. Stop at Feature06.
