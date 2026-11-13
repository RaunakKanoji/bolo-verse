# Feature 08 — revisions and resubmission

Updated 13 November 2026. [Feature specification](../../context/feature-specs/08-revisions.md) and [implementation map/plan](../superpowers/plans/2026-11-13-revisions.md). Implemented locally; real-account acceptance remains **NOT RUN**. Earlier uncommitted Features 00–07 are preserved. Nothing staged, committed, pushed, deployed or migrated in a live database.

## Before and after

Previously, creators could publish independent immutable images and explicitly share each version, but publications had no reviewed-parent relationship or resubmit transition. A creator can now select a different ready image and choose **Resubmit selected image** on a version with an `approved` or `changes_requested` decision. The publication dialog shows its parent context, retains fields and retry identity after an interrupted response, and creates a separate immutable version through the existing publication service.

The request binds the exact parent UUID, parent version number and latest decision UUID. The server requires the same project, creator edit permission, a reviewed published uploaded-image parent, a different verified asset ID and a different SHA-256 hash. Existing full-codec/byte/hash verification applies to the new image. A second upload of identical bytes is rejected. A source can be selected from existing verified ready uploads; there is no requirement to upload after the parent's timestamp. No ready rows are fabricated and browser-local adjustments are not claimed as newly uploaded bytes.

One direct successor is allowed per parent. Existing project transaction locks serialize both version allocation and successor checks; the parent review grant rows are held through commit to serialize legitimate decision writers. Parent decision/successor/source checks run before storage and again in the final transaction. Final SQL retains the current editor-permission predicate. Exact successful retries precede stale-parent checks, so retrying v2 after v3 still returns v2. Different-key competing children, stale expected parent/decision and changed retry details conflict safely.

V1 bytes, provenance, comments and decisions are never rewritten or rebound. V2 carries no approval, comments or grant. Creators must explicitly use **Share for review** on v2, including when the same client reviewed v1. Before sharing, creator status says Not submitted for review; afterward, the assigned client's v2 is Pending review. Its eventual decision binds only v2. V1's old decision remains visible to currently authorized users.

Creator history shows each immutable version, revision-of context, individual feedback/status and image previews; reviewed older displayed versions retain lazy feedback/resubmit controls. Client inbox/detail shows individual decisions or Pending review; detail now includes a descending history of only active, unexpired assignments for that subject in the selected project. Each history grant is checked while reading and the entire collected set is checked again before returning it. Revoked or ungranted versions do not appear. The existing image byte-delivery grant checks remain unchanged. The history lists original images; no computed visual diff is claimed.

The existing publication list and review history are each bounded to the latest 50 eligible entries. Version numbers remain project-wide, so unrelated/legacy publication numbers can cause gaps. There is no new deliverable grouping table, automatic grant propagation, invitation delivery, scene renderer, dependency or native UI.

## Exact Feature 08 paths

Created:

- `tests/integration/revisions.test.ts`
- `docs/superpowers/plans/2026-11-13-revisions.md`
- `docs/development/revisions-status.md`

Modified application source:

- `apps/web/src/lib/contracts/deliverables.ts` — optional strict revision binding in publication/provenance/source DTOs; legacy v1 and non-revision requests remain valid.
- `apps/web/src/server/db/deliverables.ts` — reviewed-parent validation, changed image requirement, transactional grant locking, successor exclusion, exact retry binding and safe provenance projection.
- `apps/web/src/lib/contracts/reviews.ts` — optional bounded granted-version history on detail.
- `apps/web/src/server/db/reviews.ts` — reuse the existing request database for same-project history, order by version, recheck each assignment and batch-filter current grants before returning summaries.
- `apps/web/src/features/projects/ProjectDeliverables.tsx` — parent context, revision dialog/action, response identity checks and explicit-sharing notice.
- `apps/web/src/features/projects/ReviewFeedback.tsx` — reviewed resubmit action, pending/unshared status and older-version action forwarding.
- `apps/web/src/features/reviews/ClientReview.tsx` — scoped version history, per-version status and pending review label.

Modified tests/fixtures/trackers:

- `tests/unit/deliverables.test.ts`
- `tests/e2e/deliverables.spec.ts`
- `tests/e2e/client-review.spec.ts`
- `packages/api-contract/fixtures/roundtrip.json` — three extra fixtures using existing Swift fixture cases.
- `progress-tracker.md`
- `context/progress-tracker.md`

Regenerated/synchronized:

- `docs/api/openapi.yaml`
- `packages/api-contract/openapi.json`
- `packages/api-contract/generated/models.ts`
- `packages/api-contract/generated/client.ts`
- `packages/api-contract/generated/ShapeModels.swift`
- `packages/api-contract/generated/ShapeAPIRoutes.swift`
- `apps/visionos/ShapeStudioCore/Sources/ShapeStudioCore/Generated/ShapeModels.swift`
- `apps/visionos/ShapeStudioCore/Sources/ShapeStudioCore/Generated/ShapeAPIRoutes.swift`

No Feature 08 SQL/schema/journal/lockfile change is required: the relationship lives in the existing immutable v2 JSON provenance. Existing dirty migration 0009 belongs to Feature 07 and remains a deployment prerequisite. Legacy strict scene/output v1 is unchanged. Existing HTTP routes, byte-verification service, reviewer mutation service and Share for review endpoint are reused.

## API and security

```http
POST /api/v1/projects/{projectId}/deliverables
Content-Type: application/json
```

```json
{
  "assetId": "22222222-2222-4222-8222-222222222222",
  "title": "Updated poster",
  "caption": "Lighter background requested by client",
  "revision": {
    "supersedesVersionId": "33333333-3333-4333-8333-333333333333",
    "expectedVersion": 1,
    "expectedDecisionId": "44444444-4444-4444-8444-444444444444"
  },
  "idempotencyKey": "55555555-5555-4555-8555-555555555555"
}
```

IDs are placeholders. Use the actual authorized parent/latest decision/new ready upload. The optional revision object is strict and all three fields are required together. Existing optional brief/context-only scene links remain supported. Creator identity is always derived server-side, never accepted from the body.

201 returns the normal `{ok:true,data:{deliverable},requestId}` envelope. The new deliverable has its own UUID, project-wide version, verified image/hash and `source.revision` with the exact relationship above. GET publication history/detail returns the same immutable relationship after refresh. A successful exact replay returns that same version without another storage read or duplicate row.

Existing verified Clerk browser/native bearer authentication, trusted-Origin policy, strict bounded 16 KiB JSON, image limits, durable publication quotas and sanitized no-store errors remain in force. Unauthorized project writes are 403; invalid input is 400; non-ready/foreign upload sources are 400; stale/foreign parent context, same bytes, competing successor or key conflict are 409. Oversized JSON is 413, quota is 429, missing configuration/provider failure is 503. No token, raw source key, issuer identity or private URL is added to review responses.

Explicit v2 submission uses the existing POST `.../deliverables/{v2Id}/review-grants` with an existing verified Clerk subject and fresh retry key. GET `/api/v1/reviews/{v2Id}` then returns `decision:null`, `comments:[]` and `history` entries containing only grant/review UUIDs, version, title, expiry and that subject's own decision. Unshared v2 is 403 even for v1's reviewer. Comments/decisions still require the exact grant and expected submitted version; v1's grant or a stale version cannot decide v2. Generic project/assets/brief/editor permissions never broaden.

## Verification ledger

| Status | Command / evidence |
| --- | --- |
| PASS | `pnpm exec vitest run tests/unit/deliverables.test.ts tests/integration/revisions.test.ts tests/integration/reviews.test.ts tests/integration/deliverables.test.ts tests/integration/image-ingestion.test.ts` — final 63 tests/five files, exit 0. `/tmp/shape-revisions-final-focused2.log`. Disposable real PGlite journal/constraints, actual full-decoded synthetic PNGs and server-verified JWT boundary; storage/Clerk recipient boundaries are explicit fixtures. |
| PASS | Final `pnpm check` — 14 tasks, 642 tests/67 files, lint/types/format/environment/contracts/native drift and both production builds; exit 0, 41.43 seconds. `/tmp/shape-revisions-final-check.log`. |
| PASS | `PLAYWRIGHT_OUTPUT_DIR=/tmp/shape-revisions-ui pnpm exec playwright test tests/e2e/deliverables.spec.ts tests/e2e/client-review.spec.ts tests/e2e/project-images.spec.ts --max-failures=1` — 25 cases/three files, exit 0, 44.4 seconds. Includes new selection/resubmit/context/reload, retained retry, old change request/v2 pending timeline and existing publication/review/upload flows. |
| PASS | `pnpm contracts:generate && pnpm native:sync` — additive generated artifacts synchronized. `pnpm contracts:test:swift` — 31 bidirectional fixtures/nine invalid payloads, Swift typecheck, request construction and route encoding, exit 0. |
| PASS | `pnpm native:test` — 48 tests/nine suites, exit 0. `/tmp/shape-revisions-native.log`. |
| PASS | `xcodebuild -project apps/visionos/ShapeStudio.xcodeproj -scheme ShapeStudio -destination 'generic/platform=visionOS Simulator' -derivedDataPath /tmp/shape-client-review-xcode CODE_SIGNING_ALLOWED=NO build` — BUILD SUCCEEDED, exit 0. `/tmp/shape-revisions-xcode.log`. Reused this session's build cache; compilation only, no simulator interaction/device claim. |
| PASS | Desktop/mobile revision-history screenshots inspected in `/tmp/shape-revisions-ui/`; independent code/security review completed. Review's revoked-history race has a failing-then-passing SQL regression. |
| PASS | `PLAYWRIGHT_OUTPUT_DIR=/tmp/shape-revisions-full-browser pnpm exec playwright test` — all 118 Chromium cases/16 files, exit 0, 3.6 minutes. `/tmp/shape-revisions-full-browser.log`. Includes new revisions/history and all prior publication/review/upload/brief/AI/voice/spatial/XR/recording regressions. |
| PASS | Final `git diff --check`; empty `git diff --cached --stat`. Scoped source/projection/generated-file review found no credentials, private media, raw audio or object keys in new client responses; no generated build/test output was added. Earlier unrelated dirty work remains preserved. |
| NOT RUN | Real Clerk creator/client v1 change request → actual new private R2 upload → v2 publication/explicit share → client pending/review and third-account denial. Clerk/database/R2 configuration and accounts are absent. Presence-only inspection printed no values. |
| NOT RUN | Live multi-connection Neon race scheduling, physical/native review interaction, external service setup, cloud deployment or live migration. No Feature 08 migration exists. |

The focused checks cover immutable parent/new hash, exact parent/decision binding, authorized editor vs reviewer/outsider, foreign/unreviewed parents, same bytes under different upload IDs, concurrent identical retries, competing distinct keys, retry after v3, stale decisions, invalid Origin/forged fields, post-storage authorization/decision/successor checks, explicit v2 grant, filtered/reloaded history and no inherited approval. Existing review/upload suites cover byte-delivery revocation and source validation. PostgreSQL project/grant locks are exercised in disposable SQL; this is not live two-connection evidence.

Initial contracts rejected the missing revision field and the new UI tests failed before controls/history existed. The first new test attempted a root `sharp` import that is unavailable under the monorepo's package boundary; it was replaced with valid PNG fixtures generated using the application's installed codec, without adding a dependency. A self-referential test annotation was corrected before the successful typecheck.

Independent review found an authorization window while history scanned several grants: a revoked early entry could remain after later entries loaded. The regression observed `[2,1]` instead of `[1]` before the final batch authorization filter and passed afterward. The final 642-test gate supersedes the earlier 641-test gate. No automated tests are presented as real-account or cloud acceptance.

## Manual acceptance / demo

Minimum prerequisites: configured Clerk public/server keys, DATABASE_URL and private R2 account/access/secret/bucket values; correct gateway/trusted origins/upload CORS; actual creator, non-member reviewer and unrelated third account; separately authorized existing migrations through Feature 07's 0009. Gemini/Sarvam/email are unnecessary. Use separate authenticated browser profiles and a small real poster for a short demo.

1. Publish and explicitly share v1. As client, comment and request changes. As creator, refresh and show the saved v1 decision.
2. Upload a revised image through Project images, or select a different verified ready image with changed bytes. On v1, choose Resubmit selected image. Inspect parent context and the selected original-byte preview; submit.
3. Show v2/Revision of v1 and v1's unchanged image/decision. Refresh. Before sharing, the old reviewer must receive 403 for v2 review/media. V1's assignment does not grant v2.
4. Explicitly Share for review on v2 with that client. Client opens v2; show Pending review, v1 Changes requested in granted history, and no copied approval/comment. Approve v2 if desired and refresh both accounts.
5. Third account must be denied both versions' review/media and all resubmit mutations. Try the same asset or identical bytes under a different upload: 409, no revision. A stale decision/parent or second competing successor must conflict.
6. Interrupt a resubmit response, retain the form and retry the exact key: one saved version. Show old immutable trail after refresh. Sign out/cancel during pending work: old private replies must not reappear. Revoking an old grant removes that entry from client history; creators retain authorized feedback.

These steps remain NOT RUN with real services here. Stop at Feature 08; no automatic inheritance of access/approval or future feature was implemented.

## Suggested staging and commit

Suggested Conventional Commit: `feat(delivery): support reviewed revisions and resubmission`.

No staging or commit performed. The path lists above are the exact review/staging map. Most source/generated files already contain dirty Features 00–07; package approved accumulated slices in dependency order rather than treating this as an isolated clean patch. New files can be selected after review:

```sh
git add -- tests/integration/revisions.test.ts docs/superpowers/plans/2026-11-13-revisions.md docs/development/revisions-status.md
```

Then review/stage the listed seven application files, three existing test files, JSON fixture, generated contracts and two trackers with their prerequisites. Do not stage credentials, private media, unrelated `.gitignore`/`output/` changes, node_modules or generated build/test artifacts.
