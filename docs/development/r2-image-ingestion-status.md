# Feature 05 — private project image ingestion

13 November 2026 (Asia/Kolkata). [Specification](../../context/feature-specs/05-r2-image-ingestion.md) and [implementation map](../superpowers/plans/2026-11-13-r2-image-ingestion.md). Code is implemented and locally verified; real-account/private-bucket acceptance is **NOT RUN**. Earlier uncommitted Features 00–04, `.gitignore` and design output are preserved. No staging, commit, push, live migration, cloud write/delete or deployment occurred.

## Before and after

The existing service already had actor-owned upload reservations, signed private staging PUTs, server SHA-256/full-codec validation, conditional immutable final writes, authorized ready metadata, idempotent finalize and bounded orphan cleanup. This feature reuses those routes and tables; it does not introduce a second upload strategy.

Previously, only the Creative Studio reference uploader exposed the flow, and its controls disappeared without Gemini configuration. There was no independent project image grid. Project details now include **Project images**: file picker, explicit Upload, four truthful progress stages, Cancel, same-file Retry, authorized ready thumbnails, refresh, local selection and the existing image-editor link. Ready images remain available after page refresh and through the canonical editor's existing **Refresh assets**. Upload never generates or publishes an image. This resolves the upload-availability limitation recorded in the earlier Feature 04 report.

General project uploads support static PNG/JPEG/WebP up to 20 MiB. Creative Studio reference uploads retain their smaller 10 MiB provider bound but no longer depend on Gemini availability. Server dimensions remain at most 8192 per axis and 16,777,216 pixels, with a full bounded RGBA decode before ready publication. The client SHA-256 is a reservation claim; the server recomputes it from actual stored bytes.

Same-file gallery retry retains the idempotency key. If an earlier ambiguous PUT already created the immutable stage, 409/412 proceeds to server verification rather than overwriting it. Transfer requests have a 60-second timeout and send no application cookies, bearer token or referrer to R2. Server API requests retain the existing 30-second client bound. Missing staged objects now return a sanitized incomplete-upload 409. Checksummed previews now compare actual returned bytes with persisted SHA-256 before delivering content.

Clerk session/project/role changes remount the gallery and abort its private requests. Denial clears file, grid and selection; late results are discarded. Thumbnail requests are bounded by metadata/20 MiB, dimensions and 20 seconds; blob URLs are revoked on unmount/retry. Four images per page and a 40 MiB encoded preview budget prevent loading the entire catalog at once. A failed refresh preserves the current verified grid and selected File; it does not retry uploads automatically. Selection is local preparation, not publication or approval authoring.

## Exact Feature 05 paths

Created:

- `apps/web/src/features/projects/ProjectImageLibrary.tsx`
- `apps/web/src/features/projects/project-images.ts`
- `apps/web/src/features/projects/project-images.module.css`
- `scripts/smoke-project-image.ts`
- `scripts/test-project-images-harness.mjs`
- `tests/browser-fixtures/project-images-entry.tsx`
- `tests/e2e/project-images.spec.ts`
- `tests/unit/project-images.test.ts`
- `docs/superpowers/plans/2026-11-13-r2-image-ingestion.md`
- `docs/development/r2-image-ingestion-status.md`

Modified:

- `apps/web/src/app/app/projects/[projectId]/page.tsx` — additive gallery mount; previous brief work preserved.
- `apps/web/src/features/creation/CreationControls.tsx`
- `apps/web/src/features/creation/upload-reference-image.ts`
- `apps/web/src/server/providers/r2-ingestion.ts`
- `apps/web/src/server/providers/authorized-preview.ts`
- `tests/unit/creation-reference.test.ts`
- `tests/integration/image-ingestion.test.ts`
- `tests/e2e/creation-studio.spec.ts`
- `progress-tracker.md`
- `context/progress-tracker.md`

No dependency, lockfile, migration, shared API contract, canonical scene v1, renderer, native Swift or generated artifact changed for Feature 05. Existing upload/finalization SQL and cleanup code were inspected and reused.

## API and security

Existing endpoints remain authoritative in `apps/web`. Initialization:

```http
POST /api/v1/assets/upload-session
Content-Type: application/json
```

```json
{
  "projectId": "11111111-1111-4111-8111-111111111111",
  "idempotencyKey": "33333333-3333-4333-8333-333333333333",
  "fileName": "poster.png",
  "mimeType": "image/png",
  "byteSize": 1048576,
  "checksumSha256": "<64 lowercase hex SHA-256 characters computed from the file>"
}
```

The UUIDs and checksum notation above are documentation placeholders. Authorized success returns 201 `{ok:true,data:{upload:{id,projectId,assetId,expiresAt,uploadUrl,uploadContentType}},requestId}`. The short-lived `uploadUrl` is deliberately a **sensitive staging-write capability**, required by the chosen presigned flow. It is held transiently, never shown/logged/persisted, and never grants final-object writes. No permanent credential, raw database object-key field, public bucket URL or final key is returned.

The browser performs a PUT of the File with `Content-Type` and `If-None-Match: *`; the browser derives Content-Length. The signature binds exact random staging key, MIME, length, conditional creation and at most 600 seconds/session remaining lifetime. Then:

```http
POST /api/v1/assets/upload-session/{uploadId}/finalize
Content-Type: application/json

{}
```

Success is 200 `{ok:true,data:{asset:{id,projectId,mimeType,byteSize,width,height,durationSeconds,createdAt,contentUrl,nativeContentUrl}},requestId}`. Repeating finalize returns the same ready asset. `GET /api/v1/projects/{projectId}/assets` lists ready authorized assets; `GET /api/v1/assets/{assetId}/content` returns validated bytes with private/no-store, nosniff and sandbox headers. The gallery strictly checks project and content-path identity in catalog/finalize results.

SQL requires current editor permission plus initiating actor ownership for init/finalize, including after storage latency and inside publication writes. Existing authenticated project viewers retain read access; they cannot reserve/finalize or save scenes. This preserves the repository's viewer model and the feature's authorized-user acceptance boundary. Unknown IDs/foreign projects/other actors are denied before storage reads. The input never accepts client object keys, upload destinations or arbitrary finalization fields.

Existing mutation controls retain verified Clerk identity, no forged-bearer fallback, exact trusted browser Origin/native-bearer policy, strict Zod, 16 KiB JSON boundary, 20 reservations/minute per actor and idempotent request-content matching. Actual MIME/magic, size, SHA-256, static image structure, decoder output and pixel bounds are verified server-side. Invalid/truncated/spoofed/SVG/HTML/oversized images never become ready. Final writes use server-controlled keys, `If-None-Match: *` and transport MD5; conflict recovery verifies existing final bytes rather than replacing them. Concurrent finalize converges on one asset. Ready metadata and session transition commit transactionally. Generic driver/storage exceptions never reach responses/logs.

## Private bucket and cleanup setup

Keep the bucket private; no public R2 domain or browser storage credentials are required. Configure bucket CORS for the **exact gateway origin**, PUT and `Content-Type`/`If-None-Match` headers. Do not use a wildcard origin or blanket public-read policy. Signed headers and conditional operations follow the existing [R2 presigned URL](https://developers.cloudflare.com/r2/api/s3/presigned-urls/), [conditional operation](https://developers.cloudflare.com/r2/api/s3/conditional-operations/) and [CORS](https://developers.cloudflare.com/r2/buckets/cors/) documentation. These account settings were not changed here; actual CORS/conditional-write acceptance still needs live verification.

Existing `pnpm jobs:cleanup` is a read-only count by default. Its separately authorized `--apply` mode deletes at most 20 eligible objects, with exact server-generated key checks, reference protection, SQL retirement and deletion markers. Ready upload staging copies are eligible after expiry/24-hour age; abandoned stage/final copies wait at least 24 hours beyond expiry. Published final assets are protected. Schedule it using server-only credentials before rollout, or document/supply staging retention for `staging/images/`; never apply blanket expiry to ready private images. No cleanup command with cloud access was run. Local cleanup tests exercise dry-run, age/protection, concurrency guards and safe crash recovery.

## Verification

| Status | Command / evidence |
| --- | --- |
| PASS | Final `pnpm check`: all 14 tasks, 597 tests in 61 files, both production builds, lint/typecheck/format and generated/native drift. `/tmp/shape-images-final-check.log`, exit 0, 32.87 seconds. |
| PASS | `pnpm exec vitest run tests/unit/creation-reference.test.ts tests/unit/project-images.test.ts tests/unit/r2-ingestion.test.ts tests/unit/image-ingestion-validation.test.ts tests/integration/image-ingestion.test.ts tests/integration/image-cleanup.test.ts tests/integration/xr-assets.test.ts`: 83 cases/seven files, exit 0. Log `/tmp/shape-images-acceptance-focused.log`. Includes valid PNG/JPEG/WebP, fake PNG/SVG/HTML, size/dimensions/truncation/checksum, missing stage/retry, immutable conflict recovery, concurrent/duplicate finalize, quotas, foreign project/session/Origin, revoked editor, private preview/catalog and cleanup. |
| PASS | `PLAYWRIGHT_OUTPUT_DIR=/tmp/shape-images-complete pnpm exec playwright test tests/e2e/project-images.spec.ts tests/e2e/creation-studio.spec.ts tests/e2e/spatial-workspace.spec.ts --max-failures=1`: 35 cases, three files, exit 0, 1.4 minutes. Nine gallery, eight creation and 18 canonical spatial cases. |
| PASS | Desktop/mobile screenshots inspected under `/tmp/shape-images-complete/`; genuine fixture PNG decoded in browser, selected gallery state, keyboard controls and mobile wrapping verified. Blob URL revocation/remount is separately tested. |
| PASS | Independent scoped code/security review found no material blocker; read-only review, no separate live calls claimed. |
| PASS | `node --import tsx scripts/smoke-project-image.ts` refuses without explicit `--live <image-file>`; expected exit 1, no network/storage mutation. |
| PASS | `PLAYWRIGHT_OUTPUT_DIR=/tmp/shape-images-all-e2e pnpm exec playwright test --max-failures=1`: all 102 Chromium cases in 14 files, exit 0, 3.2 minutes. Log `/tmp/shape-images-all-e2e.log`. Existing brief/brainstorm/voice/recording/XR/canonical editor regressions remain green. |
| PASS | Final `git diff --check`; scoped source/diff review found no credentials, private keys, unrelated source changes or generated build/test output. `git diff --cached --stat` is empty. Earlier uncommitted work remains preserved. |
| NOT RUN | Live Clerk/Neon/R2 acceptance, actual bucket CORS/conditional PUT, opted-in smoke, real poster persistence/foreign-account denial. Presence-only checks confirm all required Clerk/database/R2 configuration is absent; no values printed. |
| NOT RUN | New Swift/Xcode/device interaction: no native/shared source changed. Native drift passed in the workspace check. |

Test-first history: new upload helper/catalog tests failed before implementation; missing-stage and checksum-preview regressions reproduced generic503/changed-byte200 before fixes. Gallery browser harness initially failed on its missing component. The generation-disabled reference-upload regression failed before its JSX gate repair, then passed. Intermediate full checks caught two new React lint patterns (synchronous effect state updates and mutation inside render); both were fixed, and lint/types/full checks passed. The first no-args smoke invocation exposed a CJS named-import mismatch; it now uses the same supported default import as existing scripts and refuses safely.

SQL tests use disposable PGlite and real checked-in migrations. Codec tests decode real local image bytes. Browser tests use real File/HTTP/PNG decoding and explicit simulated Clerk/storage/API boundaries; they are **not live integration evidence**. No malware-scan claim, tenant organization claim, native ingestion UI or production provisioning is made.

## Live prerequisites, smoke and 90-second demo

Configure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, exact `NEXT_PUBLIC_APP_URL`/`ALLOWED_ORIGINS`, private bucket CORS and an actual existing creator account/project. Existing migrations 0006–0008 must already be applied through a separately authorized setup; this feature adds none. Gemini is **not** required for upload. No accounts, assets or approvals are fabricated.

After explicit authorization to create an asset in a disposable project, set `PROJECT_IMAGE_SMOKE_ORIGIN`, `PROJECT_IMAGE_SMOKE_PROJECT_ID` and a genuine Clerk session JWT in `PROJECT_IMAGE_SMOKE_TOKEN`, then run:

```sh
node --import tsx scripts/smoke-project-image.ts --live /path/to/poster.png
```

It intentionally leaves one private image, checks init/PUT/finalize/duplicate finalize/catalog reload/authenticated SHA-256 byte roundtrip, never logs IDs/URLs/tokens, never auto-retries, and performs no cleanup or scene mutation. Its browser-CORS/account-denial counterparts still require manual checks. This script was **not** run with `--live` here.

Manual demo:

1. Sign in as creator and open an authorized project. In **Project images**, choose a genuine poster PNG/JPEG and click Upload image. Show the four stage labels and ready thumbnail.
2. Select the image, open it in the existing image editor, return and refresh the project page. Show the same private ready image.
3. Open 3D editor → Refresh assets → place the image → adjust transform → Save scene → refresh and show it retained.
4. Try invalid bytes renamed `.png`, an image above 20 MiB and a viewer/foreign account. No invalid ready row or unauthorized content is delivered. A viewer may inspect an already-authorized ready image but has no upload controls.
5. Interrupt transfer/finalize. Show retained File and explicit same-key Retry; cancel stops client work without claiming server rollback. Refresh to check an ambiguously accepted request. To restart an expired/rejected immutable stage, choose the file again for a new reservation.
6. Sign out or close the editor during verification: old content/results disappear, upload/preview requests abort and blob URLs are revoked.

No real-account manual steps were run here; configuration/accounts/private R2 access are the remaining live acceptance prerequisite.

## Suggested staging / commit

Suggested Conventional Commit: `feat(assets): ingest validated private project images`.

After approval, stage only Feature 05 files listed above. Review hunks in the project page and both trackers with `git add -p` because they contain prior uncommitted feature work. Do not stage earlier features, `.gitignore`, `output/`, credentials or generated build/test artifacts. No staging or commit occurred.

```sh
git add -- apps/web/src/features/projects/ProjectImageLibrary.tsx apps/web/src/features/projects/project-images.ts apps/web/src/features/projects/project-images.module.css apps/web/src/features/creation/CreationControls.tsx apps/web/src/features/creation/upload-reference-image.ts apps/web/src/server/providers/r2-ingestion.ts apps/web/src/server/providers/authorized-preview.ts scripts/smoke-project-image.ts scripts/test-project-images-harness.mjs tests/browser-fixtures/project-images-entry.tsx tests/e2e/project-images.spec.ts tests/e2e/creation-studio.spec.ts tests/unit/project-images.test.ts tests/unit/creation-reference.test.ts tests/integration/image-ingestion.test.ts docs/superpowers/plans/2026-11-13-r2-image-ingestion.md docs/development/r2-image-ingestion-status.md
git add -p -- 'apps/web/src/app/app/projects/[projectId]/page.tsx' progress-tracker.md context/progress-tracker.md
```
