# Feature 06 — immutable uploaded-image publication

13 November 2026 (Asia/Kolkata). [Spec](../../context/feature-specs/06-deliverable-publication.md) and [implementation map](../superpowers/plans/2026-11-13-deliverable-publication.md). Implemented locally; real Clerk/Neon/R2 acceptance is **NOT RUN**. Existing uncommitted Features 00–05 and design output remain intact. No staging, commit, push, live migration, cloud write, provider call or deployment occurred.

## Delivered behavior

The repository already had immutable content versions and verified private uploads. It lacked a publication API/dialog/history. Project editors can now select a ready **uploaded** image, explicitly open Publish, enter a title/caption and optional source links, then create a frozen private content version. History includes version, title, timestamp, Uploaded image/Published badges and authenticated original-byte preview. Refresh reloads persisted versions. Local canvas edits are not silently published.

`UploadedImageProvenanceSchema` is separately versioned (`schemaVersion:2`, `sourceType:uploaded_image`). It stores server-derived publisher identity/project, exact asset ID/SHA-256, title/caption and optional real brief version/canonical scene revision. The public projection omits publisher identity and private keys. A scene link has `sceneRelation:context_only`; UI explicitly says the image was **not rendered from that scene**. The legacy v1 `OutputSourceSnapshotSchema` is unchanged and has an exact backward-compatibility test. Canonical scene v1 and renderer boundaries are unchanged.

Only verified upload-session assets at their exact server-controlled final key are eligible in this slice. Provider-generated images are rejected rather than falsely labelled uploaded. Publication re-reads bounded private bytes and verifies MIME, byte count, SHA-256, codec and dimensions before the SQL publication transaction. Project, ready upload/asset identity and optional source links are rechecked after storage latency.

Existing `content_versions` stores the ready/published record. Project row locking allocates the next version across existing content rows; existing uniqueness remains the backstop. The UUID idempotency key is the immutable content-version ID. Successful exact retries return the same old version even after later publications, without a new storage read/quota charge. Changed actor/project/details with a reused key conflict. New attempts use an atomic durable 20/minute actor budget before storage verification.

The existing ready-content trigger rejects UPDATE/DELETE, the ready-asset trigger rejects identity changes, asset references prevent deletion, and existing review decisions remain append-only. No new table, migration or dependency was needed; only the DB TypeScript snapshot union widened. Publication performs **no storage write**, grant, review decision or approval. History/detail are currently project-editor-only: publication alone grants clients/reviewers nothing. Existing authorized source-asset visibility is unchanged.

Dialog failures retain fields and the exact retry key. Escape/Cancel abort client work; copy explains that an accepted server publication may still exist and history should be refreshed. Session/project/role changes discard private state and late replies. Opening publication is blocked during upload/library refresh so an incidental selection change cannot discard its form. Shared bounded thumbnail loading was extracted from the existing gallery; blob URL cleanup and preview budgets are retained.

## Exact Feature 06 files

Created:

- `apps/web/src/lib/contracts/deliverables.ts`
- `apps/web/src/server/db/deliverables.ts`
- `apps/web/src/server/services/deliverables.ts`
- `apps/web/src/app/api/v1/projects/[projectId]/deliverables/route.ts`
- `apps/web/src/app/api/v1/projects/[projectId]/deliverables/[deliverableId]/route.ts`
- `apps/web/src/features/projects/ProjectDeliverables.tsx`
- `apps/web/src/features/projects/ProjectImageThumbnail.tsx`
- `apps/web/src/features/projects/deliverables.module.css`
- `tests/unit/deliverables.test.ts`
- `tests/integration/deliverables.test.ts`
- `tests/e2e/deliverables.spec.ts`
- `docs/superpowers/plans/2026-11-13-deliverable-publication.md`
- `docs/development/deliverable-publication-status.md`

Modified:

- `apps/web/src/server/db/schema.ts` — TypeScript snapshot union only, no SQL change.
- `apps/web/src/lib/contracts/shape.ts` — additive schemas and three operations.
- `apps/web/src/features/projects/ProjectImageLibrary.tsx` — additive publisher/history mount and shared-thumbnail extraction; Feature 05 preserved.
- `tests/e2e/project-images.spec.ts` — explicit empty publication-history HTTP fixture for existing upload tests.
- `packages/api-contract/fixtures/roundtrip.json`
- `packages/api-contract/fixtures/Roundtrip.swift`
- `progress-tracker.md`
- `context/progress-tracker.md`

Generated/synchronized:

- `docs/api/openapi.yaml`
- `packages/api-contract/openapi.json`
- `packages/api-contract/generated/models.ts`
- `packages/api-contract/generated/client.ts`
- `packages/api-contract/generated/ShapeModels.swift`
- `packages/api-contract/generated/ShapeAPIRoutes.swift`
- `apps/visionos/ShapeStudioCore/Sources/ShapeStudioCore/Generated/ShapeModels.swift`
- `apps/visionos/ShapeStudioCore/Sources/ShapeStudioCore/Generated/ShapeAPIRoutes.swift`

No native UI, engine dependency, lockfile or migration changed. The existing `documents.ts` changes in the dirty tree belong to Feature 01, not this feature; its legacy output union was not edited.

## API and trust boundaries

```http
POST /api/v1/projects/{projectId}/deliverables
Content-Type: application/json
```

```json
{
  "assetId": "22222222-2222-4222-8222-222222222222",
  "title": "Launch poster",
  "caption": "First discussion version",
  "briefVersion": 1,
  "sceneRevision": 2,
  "idempotencyKey": "33333333-3333-4333-8333-333333333333"
}
```

UUIDs are placeholders; real authorized verified assets are required. Brief/scene/caption are optional. A scene revision must be the current saved canonical revision and is locked `FOR SHARE` through commit so concurrent scene saves cannot invalidate the check. Brief version resolves a real same-project immutable identity. It is a source reference, not brief approval.

Success/replay: 201 `{ok:true,data:{deliverable:{deliverableId,projectId,version,title,caption,status:"published",publishedAt,source,asset}},requestId}`. Source contains schemaVersion2, uploaded_image, project/asset IDs, SHA-256 and optional source links/context-only relation. Asset is the existing safe DTO with relative authenticated preview URL. No source key, signed URL, publisher ID, upload credential, prompt or draft is returned.

`GET /api/v1/projects/{projectId}/deliverables` returns the latest 50 uploaded-image versions as `{deliverables,hasMore,canPublish}` in the normal success envelope. Versions use the existing project-wide numbering, so legacy content can create gaps in this filtered list. `GET /api/v1/projects/{projectId}/deliverables/{deliverableId}` returns one authorized version. Both require current project editor permission; assigned clients/outsiders receive 403. Grant issuance/review authoring is outside Feature 06.

Every operation uses server-verified Clerk identity. POST preserves exact trusted browser Origin/native bearer policy, rejects identity/object-key injection with strict Zod and the existing 16 KiB JSON reader, and uses sanitized no-store responses. Invalid identity is 401; denied/missing private resources 403; invalid/non-ready/foreign/unverified source 400; missing object, stale source links or mismatched retries 409; large body 413; quota 429; unconfigured/failed services 503. SQL authorization is repeated in the final insert, not taken from the client. Successful retries remain available when the new-attempt budget is full.

## Verification ledger

| Status | Command / evidence |
| --- | --- |
| PASS | `pnpm exec vitest run tests/unit/deliverables.test.ts tests/integration/deliverables.test.ts tests/unit/contracts.test.ts` — 72 tests/three files, exit 0. `/tmp/shape-publication-final-focused.log`. Covers exact legacy v1 compatibility; provenance injection; uploaded bytes/hash; non-ready/foreign/missing/generated sources; deleted/changed object; actor/Origin/body checks; revoked permission after storage latency; sequential/concurrent duplicate keys; unique concurrent versions; source links; quotas; immutable content/assets/decisions; sanitized errors. |
| PASS | Final `pnpm check` — all 14 tasks, 613 tests/63 files and both production builds, lint/types/format/environment/contracts/native drift. Exit 0, 35.004 seconds. `/tmp/shape-publication-final-check.log`. |
| PASS | `PLAYWRIGHT_OUTPUT_DIR=/tmp/shape-publication-ui-final pnpm exec playwright test tests/e2e/deliverables.spec.ts tests/e2e/project-images.spec.ts --max-failures=1` — 15 cases/two files, exit 0. Six publication and nine existing image cases; actual decoded private-image fixtures, reload/history, title validation, context badge, retained retries, access loss, cancel/sign-out late-result handling and delayed-upload selection guard. |
| PASS | `pnpm contracts:test:swift` — 25 bidirectional JSON fixtures, nine invalid payloads, Swift typecheck, request construction and route encoding. `/tmp/shape-publication-swift.log`. |
| PASS | `pnpm native:test` — 48 core tests/nine suites, same log. |
| PASS | `xcodebuild -project apps/visionos/ShapeStudio.xcodeproj -scheme ShapeStudio -destination 'generic/platform=visionOS Simulator' -derivedDataPath /tmp/shape-publication-xcode CODE_SIGNING_ALLOWED=NO build` — `BUILD SUCCEEDED`, exit 0. `/tmp/shape-publication-xcode.log`. Compilation only, no simulator interaction or physical-device claim. |
| PASS | Desktop/mobile publication-history screenshots inspected under `/tmp/shape-publication-ui-final/`. Independent backend/UI review findings fixed with regressions. |
| PASS | `PLAYWRIGHT_OUTPUT_DIR=/tmp/shape-publication-final-e2e pnpm exec playwright test --max-failures=1` — all 108 Chromium cases/15 files, exit 0, 3.1 minutes. `/tmp/shape-publication-final-e2e.log`. Includes all six publication cases and existing upload/brief/brainstorm/voice/canonical/XR/recording regressions. |
| PASS | Final `git diff --check`; scoped file/projection review found no credentials, source object keys in responses, unrelated source rewrites or generated build/test artifacts. `git diff --cached --stat` is empty. Previous dirty work is preserved. |
| NOT RUN | Genuine Clerk creator, live Neon transaction/R2 source verification, real poster publication/reload and denied-account checks. Presence-only inspection confirms Clerk/database/R2 configuration absent; no values printed. |
| NOT RUN | Physical device/native publication UI, live two-connection PostgreSQL scene-save interleaving or provider/hosting verification. No native publication UI was added. |

Earlier successful full checks covered 611 tests before the last two security/quota cases; the final 613-test gate supersedes them. An intermediate lint gate found two unused symbols, which were removed. The first publication contracts/routes and UI tests failed before their implementations. The legacy source union remains unchanged.

Independent review found two P2 races. First, the optional scene check initially used a plain SELECT; it now holds a PostgreSQL share lock through publication commit. Its regression fails without the clause and passes with it, observing actual emitted transaction SQL via the Drizzle logger. PGlite queues transactions; this is **not** claimed as a live two-connection race simulation. An initial root-client query spy missed transaction-local SQL and was corrected. Second, an upload finishing while a publication dialog was open could remount/discard its form; the delayed-upload regression failed before the selection-work guard and passed after it. A proposed hardcoded review state was removed so publication cannot imply any later decision.

Local SQL tests use real disposable PGlite constraints/migrations; storage and browser identity/HTTP boundaries are explicit fixtures. Genuine PNG bytes are decoded/validated locally. They are not live Clerk/Neon/R2 acceptance or a claim that uploaded posters were rendered from scenes.

## Live prerequisites and 90-second manual demo

Configure an actual existing Clerk creator/project, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`, private `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, exact public gateway origin/allowed origins and the existing private upload CORS. Use Feature 05's real verified uploaded image workflow in a disposable project. Existing migrations must already be applied through separately authorized setup; Feature 06 adds none. Gemini is not required.

1. Open the project, upload a real PNG/JPEG through Project images if needed, and select the ready poster.
2. Choose Publish selected image. Show the original-byte preview and Uploaded image notice. Enter title/caption; leave source links empty or choose actual saved versions. Choose Publish version.
3. Show v1, Published, its timestamp and preview. Refresh the page and show the same version/image. A second intentional publication gets a new number; it does not replace v1.
4. Repeat an exact request with the same idempotency key: same version ID/number. Change details with that key: 409. During a network failure, show the retained form and explicit retry/history recovery.
5. A viewer/outsider cannot publish or read this editor-only history/detail. No access grant, approval or public URL is created. Wrong-project/staging/missing source never creates a version.
6. If linking a scene revision, show the context-only statement. Changes in a saved canonical scene do not silently change old poster bytes or provenance. Close/cancel or change account during pending work: old replies are discarded; accepted server work is discovered by refreshing history.

Real-account steps are NOT RUN here. Minimum remaining acceptance prerequisites are configured identity/database/private R2 and a verified ready uploaded asset; source implementation alone is not a live integration.

## Suggested staging / commit

Suggested Conventional Commit: `feat(delivery): publish immutable image deliverable versions`.

The exact file list above is the review map. Earlier features are still uncommitted, including the image-library file and shared generated artifacts. Package approved accumulated slices in dependency order; do not blindly stage these mixed files as a standalone baseline patch. No staging or commit was performed. New Feature 06 files can be selected explicitly after approval:

```sh
git add -- apps/web/src/lib/contracts/deliverables.ts apps/web/src/server/db/deliverables.ts apps/web/src/server/services/deliverables.ts 'apps/web/src/app/api/v1/projects/[projectId]/deliverables/route.ts' 'apps/web/src/app/api/v1/projects/[projectId]/deliverables/[deliverableId]/route.ts' apps/web/src/features/projects/ProjectDeliverables.tsx apps/web/src/features/projects/ProjectImageThumbnail.tsx apps/web/src/features/projects/deliverables.module.css tests/unit/deliverables.test.ts tests/integration/deliverables.test.ts tests/e2e/deliverables.spec.ts docs/superpowers/plans/2026-11-13-deliverable-publication.md docs/development/deliverable-publication-status.md
```

Then review/stage the listed schema/registry/gallery/fixture/generated/tracker changes with their already-authorized dependencies. Exclude credentials, private media, `.gitignore`/`output/` unrelated edits, node_modules and test/build artifacts. Stop at Feature 06; reviewer sharing/decisions are not silently implemented.
