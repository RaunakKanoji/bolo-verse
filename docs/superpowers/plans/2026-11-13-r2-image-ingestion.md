# Secure private project images implementation plan

> **For agentic workers:** Use inline execution with focused behavioral tests and independent review. The supplied feature protocol authorizes implementation in the existing dirty workspace; no staging/commit/external changes without approval.

**Goal:** Connect the existing verified staged-image service to an independent project upload/gallery workflow.

**Spec:** `context/feature-specs/05-r2-image-ingestion.md`.

## Implementation map / current behavior

- Existing `asset-ingestions.ts` reserves random actor/project-bound sessions and staging assets, validates idempotency, enforces 20 sessions/minute and publishes with SQL authorization/CAS. `image-ingestion.ts` verifies MIME/magic/size/SHA256/full codec pixels before immutable final PUT and ready metadata. Reuse these, not another upload API.
- Chosen single flow: presigned conditional PUT to scoped private staging, server verification/promotion, existing authorized catalog/preview. Existing maximum is 20 MiB, 8192 per axis and 16,777,216 pixels; staging URL at most 600 seconds. Browser generation references retain their smaller 10 MiB limit. No second upload method, dependency, table, migration or contract change.
- `upload-reference-image.ts` only supports generation references and has no stable retry key, upload timeout or phase progress. Extend it with a general project-image helper, keeping the existing reference wrapper compatible.
- `CreationControls.tsx` currently hides uploads behind Gemini capability; decouple its existing reference upload from generation availability. `ProjectPage` lacks a ready-image gallery; add `ProjectImageLibrary.tsx` + scoped CSS with actual private previews, upload stages, retained retry, refresh and selection. Mount on the existing project detail page with server-provided editor permission and Clerk session-owned teardown. No publication/approval mutation.
- Missing staged-object errors currently collapse to generic 503. Give a sanitized incomplete-upload conflict. Private previews validate structure and metadata consistency but do not compare returned bytes to persisted SHA256; bind checksummed images before delivering bytes.
- Existing bounded orphan cleanup (20 objects/batch, dry-run default, expired-only protected keys after 24 hours) remains. Document scheduling/retention; do not run cloud cleanup.
- Tests: extend creation-reference unit, R2 provider unit, ingestion SQL/preview, cleanup regressions and generation browser test; add isolated project-gallery browser harness/spec and session alias. Reuse real PNG/JPEG decoding and R3F spatial suite for refreshed catalog compatibility.
- Update both progress trackers and `docs/development/r2-image-ingestion-status.md` with exact files, security, API examples, evidence, live prerequisites and 90-second demo.

## Review focus

- Same-file retry after ambiguous PUT/finalize must reuse one reservation and never overwrite staged/final bytes; a conditional conflict proceeds only to server verification.
- Invalid or cross-project asset/session results must never become selectable or leak a signed capability into logs/UI.
- Session/role loss and project change abort uploads and private preview requests, clear selected/local data, and discard late results.
- Invalid codecs, missing objects, oversize and revoked membership never publish ready metadata; ready reads remain authorized for existing project viewers.
- A failed catalog refresh must retain successful upload state and avoid an automatic duplicate upload; gallery reflects real server ready assets only.

## Task 1 — client upload/retry and server boundaries

- [x] Write failing tests for stable-key retries/conditional PUT conflict, upload phase order/identity validation, 20 MiB project versus 10 MiB reference bounds; missing staged object, post-finalize private preview/denial and checksummed-byte mismatch.
- [x] Implement general project image upload using existing init/PUT/finalize, bounded PUT timeout, same key on retry and full finalized asset identity validation. Preserve original reference API and small bound.
- [x] Repair sanitized missing-stage handling and preview checksum verification; extend SQL/concurrency/security coverage without schema changes.
- [x] Run focused unit, ingestion, XR assets and cleanup SQL suites.

## Task 2 — independent project image library

- [x] Add failing browser cases for PNG upload/real image decode/selection/refresh without Gemini, stages/retry/cancel, invalid/oversized files, read-only/denied accounts, bad catalog and session/unmount late-response teardown.
- [x] Implement a session-scoped ready gallery and uploads on project detail; show honest stage progress, retry for the retained File/key, explicit cancellation, bounded authenticated blob thumbnails and cleanup. Selection is local, not publication.
- [x] Make existing Creative Studio reference upload independent of Gemini. Preserve generation restrictions and 10 MiB reference limit.
- [x] Run browser upload, creation and spatial compatibility flows; inspect desktop/mobile screenshots.

## Task 3 — final gates and delivery

- [x] Independent review; reproduce/fix material findings.
- [x] Run `pnpm check`, full Chromium regression, native drift and `git diff --check`; inspect scoped files and preserve previous work.
- [x] Record PASS/FAIL/NOT RUN, exact paths/API controls, manual QA, staging paths and suggested Conventional Commit. Live Clerk/Neon/R2 acceptance and cloud provisioning remain NOT RUN if configuration is absent. No commit/push/deployment/live migration/external mutation.

## Execution ledger

- Task 1 complete: new project-upload/catalog tests failed before implementation; missing staged object (503 instead of actionable409) and changed preview bytes (200 instead of rejection) reproduced then passed after fixes. Final focused run passed 83 tests in seven files, including concurrent finalize, database quota, real codec and cleanup boundaries.
- Task 2 complete: nine gallery browser cases pass; independent uploads, decoded ready grid/selection/refresh, stable-key retry after conditional PUT, invalid files, cancel, readonly/access loss, late response invalidation, revoked role, bad catalog and blob URL cleanup/remount verified. The Gemini-disabled reference uploader regression failed before its gate repair and then passed. All 35 gallery/creation/spatial cases passed together; desktop/mobile screenshots inspected.
- Task 3 complete: independent scoped review found no material blocker. Final pnpm check passed all14 tasks, 597 tests/61 files and both builds; full Chromium passed102 cases/14 files; whitespace/staging checks passed. Native artifact drift passed with no native implementation changes.
- Scope addition: explicit opt-in smoke script creates exactly one private image in a separately authorized disposable project and verifies duplicate finalize/catalog/content SHA256. No-args refusal tested; live execution NOT RUN. An initial CJS named-import issue was corrected to the existing default-import pattern.
- Live gate NOT RUN: genuine Clerk account/project, database, private R2 credentials/CORS unavailable. No cloud upload/cleanup/configuration, live migration, deployment, staging, commit or push. No second upload strategy, migration, dependency, schema/contract or native change.
- Delivery/evidence/manual QA/staging paths: docs/development/r2-image-ingestion-status.md. Stop at Feature05.
