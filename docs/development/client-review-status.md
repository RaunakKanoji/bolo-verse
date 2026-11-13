# Feature 07 — authenticated client review

Updated 13 November 2026. Implemented locally against [Feature 07](../../context/feature-specs/07-client-review.md); live acceptance remains **NOT RUN**. Earlier uncommitted Features 00–06 are preserved. No staging, commit, push, deployment, external account change or live migration occurred.

## Behavior and policy

Before this slice, published image versions were editor-only and review/grant tables had no authenticated reviewer flow. Creators can now use **Share for review** on a published version, enter an existing Clerk subject and assign that exact version for 1–30 days (seven by default). The server verifies the actual account through Clerk after checking creator permission. It refuses recipients with existing broad project access and creates no membership. One identity-bound reviewer can be active per version at a time; creators can revoke that assignment and manage older versions through their expandable feedback panel. The first four displayed versions load feedback immediately; older displayed versions load it when opened. The existing publication list remains bounded to 50 versions.

The assigned client signs in and opens `/reviews` or `/reviews/{versionId}`. Only explicitly granted published uploaded-image versions appear. The detail contains the title, caption, immutable version number, timestamps, bounded authenticated image and that reviewer's comments/decision. It exposes no project/asset source IDs, object keys, draft briefs, AI history, issuer identity or editor permissions. Existing project/asset APIs still reject a reviewer who has only a review grant.

Comments and decisions bind the verified actor, exact grant, version ID and expected version number. A UUID is the immutable action's retry key: an exact retry returns the existing result; mismatched key reuse is 409. There is one terminal decision per reviewer/version, either `approved` or `changes_requested`. A different-key second decision or new comment after that decision is 409; exact prior retries remain available while the grant is active. A new decision requires a new published version. Existing timecode fields remain supported. Old granted versions remain readable until expiry or revocation; publishing v2 does not silently grant v2 or withdraw v1. Creator refresh reads persisted feedback and the latest stored decision.

Private media is fetched through the server, bounded by stored byte length, and checked against its immutable MIME/hash/header metadata. The grant is checked before storage access, after storage latency and on each stream pull (at most 1 MiB per chunk, zero prefetch). Revoking access after response construction but before consumption prevents byte delivery. Previously delivered bytes cannot be recalled. Responses are private/no-store with nosniff, sandbox and no-referrer headers; there is no public/signed R2 URL.

The UI includes loading, empty, error, denied/revoked states, an actual decoded image prerequisite for decisions, retained text/retry keys after interrupted actions, and session/version teardown that aborts pending requests and revokes preview blob URLs. It discards late private responses. Review actions do not send email or notifications. The share action explicitly uses an existing Clerk account ID; no invitation platform or anonymous token redemption was introduced.

## Exact Feature 07 files

Created application files:

- `apps/web/src/lib/contracts/reviews.ts`
- `apps/web/src/server/auth/review-boundary.ts`
- `apps/web/src/server/auth/review-recipient.ts`
- `apps/web/src/server/db/reviews.ts`
- `apps/web/src/server/services/reviews.ts`
- `apps/web/src/app/api/v1/reviews/route.ts`
- `apps/web/src/app/api/v1/reviews/[versionId]/route.ts`
- `apps/web/src/app/api/v1/reviews/[versionId]/content/route.ts`
- `apps/web/src/app/api/v1/reviews/[versionId]/comments/route.ts`
- `apps/web/src/app/api/v1/reviews/[versionId]/decision/route.ts`
- `apps/web/src/app/api/v1/projects/[projectId]/deliverables/[deliverableId]/review-grants/route.ts`
- `apps/web/src/app/api/v1/projects/[projectId]/deliverables/[deliverableId]/review-grants/[grantId]/revoke/route.ts`
- `apps/web/src/app/reviews/page.tsx`
- `apps/web/src/app/reviews/[versionId]/page.tsx`
- `apps/web/src/features/reviews/ClientReview.tsx`
- `apps/web/src/features/reviews/review-preview.ts`
- `apps/web/src/features/reviews/reviews.module.css`
- `apps/web/src/features/projects/ReviewFeedback.tsx`

Created migration/testing/documentation files:

- `drizzle/0009_client_review.sql`
- `drizzle/meta/0009_snapshot.json`
- `tests/unit/reviews.test.ts`
- `tests/unit/review-recipient.test.ts`
- `tests/integration/reviews.test.ts`
- `tests/e2e/client-review.spec.ts`
- `tests/browser-fixtures/client-review-entry.tsx`
- `scripts/test-client-review-harness.mjs`
- `docs/superpowers/plans/2026-11-13-client-review.md`
- `docs/development/client-review-status.md`

Modified files (some already contain earlier uncommitted slices):

- `apps/web/src/server/db/schema.ts` — additive recipient/grant bindings and indexes; preserves the earlier publication snapshot union.
- `apps/web/src/lib/contracts/shape.ts` — additive review schemas and seven JSON operations.
- `apps/web/src/app/layout.tsx` — Reviews navigation; pages enforce real server identity.
- `apps/web/src/features/projects/ProjectDeliverables.tsx` — feedback controls for current and older displayed versions.
- `drizzle/meta/_journal.json` — migration 0009 registration.
- `tests/e2e/deliverables.spec.ts` — review feedback fixtures and old-version revoke regression.
- `packages/api-contract/fixtures/roundtrip.json`
- `packages/api-contract/fixtures/Roundtrip.swift`
- `progress-tracker.md`
- `context/progress-tracker.md`

Generated/synchronized files:

- `docs/api/openapi.yaml`
- `packages/api-contract/openapi.json`
- `packages/api-contract/generated/models.ts`
- `packages/api-contract/generated/client.ts`
- `packages/api-contract/generated/ShapeModels.swift`
- `packages/api-contract/generated/ShapeAPIRoutes.swift`
- `apps/visionos/ShapeStudioCore/Sources/ShapeStudioCore/Generated/ShapeModels.swift`
- `apps/visionos/ShapeStudioCore/Sources/ShapeStudioCore/Generated/ShapeAPIRoutes.swift`

No dependency/lockfile change was needed. No scene wire format, engine, native UI or spatial application change belongs to this slice. The byte content route is documented below; the current generator registry generates JSON operations only.

## Migration and security boundaries

Migration 0009 adds nullable `access_grants.reviewer_clerk_id` and nullable `review_grant_id` to existing comments/decisions, composite project/grant foreign keys, an identity-bound review-scope check, a partial unique active assignment per version and a partial unique terminal decision per reviewer/version. A SQL trigger makes comments append-only; existing decision/content/ready-asset protections remain. No new table is created. Generated SQL/snapshot/journal were reviewed and tested with the complete journal in disposable PGlite only. Live application requires separately authorized migration through 0009.

Legacy grants without a recipient identity are not accepted by these new routes. The required legacy `secret_hash` column receives a random digest; no raw access token is issued, returned, logged or used. `max_uses`/`use_count` are retained legacy storage fields, not an identity-flow redemption mechanism. Invite-token reuse/expiry-redemption tests are **NOT APPLICABLE**; actual identity-bound grant expiry/revocation are tested.

Every route uses the existing verified Clerk browser/bearer boundary. Mutations preserve trusted-Origin/bearer policy, strict Zod, UUID paths, the existing bounded 16 KiB JSON reader and sanitized no-store envelopes. Creator grant writes repeat project permission in their final SQL statement after the external recipient lookup. Reviewer writes lock the assignment through the transaction, recheck active recipient/version binding and append immutable rows. Durable actor quotas bound share attempts to 20/minute and new review actions to 60/minute; exact successful retries are deterministic.

Identity absence is 401; inaccessible private resources are 403; invalid strict input is 400; state/version/key conflict is 409; oversized JSON is 413; quota is 429; absent/unavailable infrastructure is 503. Failed recipient lookups use a sanitized 400 without exposing provider details. No public test-auth bypass exists; browser aliases run only inside the isolated test harness.

## API examples

These are placeholder UUIDs/account IDs; use actual authorized resources. Normal JSON responses use `{ok:true,data:...,requestId}` and sanitized error envelopes.

```http
POST /api/v1/projects/{projectId}/deliverables/{versionId}/review-grants
Content-Type: application/json
```

```json
{"reviewerId":"user_ExampleClient","expiresInDays":7,"idempotencyKey":"33333333-3333-4333-8333-333333333333"}
```

201 returns `data.grant` with grant/review UUIDs, expiry, revocation timestamp, creation time, active flag and the relative `/reviews/{versionId}` URL. The URL conveys no authorization. GET on the same creator path returns `data.feedback` with bounded grant/comment/decision history and `latestDecision`. POST `.../review-grants/{grantId}/revoke` accepts strict `{}` and is idempotent.

GET `/api/v1/reviews` returns up to 50 assigned summaries and `hasMore`. GET `/api/v1/reviews/{versionId}` returns `data.review`, including its exact `grantId`, number, safe metadata, own feedback and a relative preview URL. GET `/api/v1/reviews/{versionId}/content` delivers only authenticated image bytes.

```http
POST /api/v1/reviews/{versionId}/comments
Content-Type: application/json
```

```json
{"grantId":"33333333-3333-4333-8333-333333333333","expectedVersion":1,"idempotencyKey":"44444444-4444-4444-8444-444444444444","comment":"Please adjust contrast."}
```

```http
POST /api/v1/reviews/{versionId}/decision
Content-Type: application/json
```

```json
{"grantId":"33333333-3333-4333-8333-333333333333","expectedVersion":1,"idempotencyKey":"55555555-5555-4555-8555-555555555555","decision":"approved","comment":"Ready to use."}
```

Both action endpoints return 200 with the refreshed scoped review. `changes_requested` is the other accepted decision. Comment text is bounded to 2,000 characters; an optional comment timecode is bounded to 0–600 seconds. Actor IDs, arbitrary object URLs and extra fields are rejected.

## Verification ledger

| Status | Command / evidence |
| --- | --- |
| PASS | `pnpm exec vitest run tests/unit/reviews.test.ts tests/unit/review-recipient.test.ts tests/integration/reviews.test.ts tests/integration/deliverables.test.ts tests/integration/image-ingestion.test.ts` — 55 tests/five files. `/tmp/shape-review-final-focused.log`. Genuine disposable SQL migrations/constraints and verified session JWT boundary; Clerk recipient/storage providers are explicit fixtures. Covers role/project/version isolation, zero new memberships, existing broad-member rejection, expiry/revocation, source binding, immutable rows, exact/conflicting retries, concurrent decisions/comments, stale version, actor injection, bounded bodies, hostile Origin and revocation before media delivery. |
| PASS | `pnpm contracts:generate && pnpm native:sync` — synchronized TS/OpenAPI/Swift additions. The generator rejected Zod JSON Schema defaults initially; expiry is now normalized server-side to seven days without changing its wire input. |
| PASS | `PLAYWRIGHT_OUTPUT_DIR=/tmp/shape-review-client-final pnpm exec playwright test tests/e2e/client-review.spec.ts --max-failures=1` — six cases, 6.6 seconds: inbox/decoded image/comment/change request/creator refresh, share/revoke, denied preview cleanup, retained retry, late session response and approval persistence. Desktop/mobile screenshots inspected in this output directory. |
| PASS | `PLAYWRIGHT_OUTPUT_DIR=/tmp/shape-review-creator-final pnpm exec playwright test tests/e2e/deliverables.spec.ts tests/e2e/project-images.spec.ts --max-failures=1` — 16 cases/two files, 25.4 seconds. Includes revoking a v1 grant after publishing v5 and all existing upload/publication cases. |
| PASS | `pnpm contracts:test:swift && pnpm native:test` — 28 bidirectional contract fixtures, nine invalid payloads, Swift typecheck/request/route checks; 48 native core tests/nine suites. No native review UI or device interaction claimed. |
| PASS | `xcodebuild -project apps/visionos/ShapeStudio.xcodeproj -scheme ShapeStudio -destination 'generic/platform=visionOS Simulator' -derivedDataPath /tmp/shape-client-review-xcode CODE_SIGNING_ALLOWED=NO build` — exit 0, compilation only. `/tmp/shape-client-review-xcode.log`. |
| PASS | Final `pnpm check` after targeted formatting — all 14 tasks, 631 tests/66 files, lint/types/format/environment/contracts/native drift and both production builds; exit 0, 40.67 seconds. `/tmp/shape-review-formatted-check.log`. |
| PASS | `PLAYWRIGHT_OUTPUT_DIR=/tmp/shape-review-full-browser pnpm exec playwright test` — all 115 Chromium cases/16 files; exit 0, 3.9 minutes. `/tmp/shape-review-full-browser.log`. Includes all review/publication/upload/brief/brainstorm/voice/spatial/XR/recording regressions. |
| PASS | Final `git diff --check`; `git diff --cached --stat` empty. Scoped source/projection review found no credentials, raw audio, private R2 keys in client responses or generated test/build output added to this slice. Pre-existing unrelated dirty files remain preserved. |
| NOT RUN | Real creator/client publish → review → approval and third-account API/media denial on live Clerk/Neon/private R2. Presence-only inspection found all seven required Clerk/database/R2 environment variables absent and only `.env.example` in the workspace. No secret values were printed. |
| NOT RUN | Physical-device review, live multi-connection PostgreSQL races, cloud configuration/deployment and external notifications. |

The initial contract/repository and browser cases failed before implementation. Independent review found a final-write authorization gap and a missing revoke control outside the newest four versions. SQL regressions failed with 201/200 instead of 403 before the final write predicates and then passed; the UI regression failed before the older-version expandable panel and then passed. The SQL test injects an actual membership deletion immediately before a transaction's final write in disposable PGlite; it is not a claim of live two-connection scheduling. Two intermediate browser failures were ambiguous accessible-name test locators; exact role/name assertions corrected those tests. No production bypass or fake live-success fallback was added.

## Remaining acceptance and 90-second manual demo

Minimal prerequisites: configured `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`, private `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`; correct gateway/trusted origins and upload CORS; separately authorized migrations through 0009; a creator-owned project and real ready image published via Features 05/06; one existing non-member client and a third unrelated account. Obtain the existing client subject from authorized account administration. Gemini/Sarvam and email delivery are unnecessary.

1. As creator, open the published version, enter the actual client's Clerk ID and choose Share for review. Show the expiry and authenticated review path. Attempting a project member as recipient should be rejected.
2. In a separate authenticated client browser/profile, open Reviews, select the exact version and show its private image. Add a comment and choose Approve (or Request changes with a note).
3. Refresh the client page and creator feedback. Show the same saved terminal decision and comment. A different-key second decision must conflict; an exact request replay must not duplicate it.
4. In the third account, request the review API and content URL: both must deny. The assigned client must also be denied generic project assets, briefs, AI history, editor mutations and ungranted versions.
5. As creator revoke the grant. Refresh/retry client review and image: both deny and controls/private preview clear. Show that an older v1 assignment remains manageable after publishing v5. Expired assignments deny identically.
6. Interrupt a comment response and retry: input and retry key remain, with a single persisted row. Switch/sign out during a pending decision: the old result must not reappear. Previously accepted writes are discovered by refreshing with current access.

These real-account steps remain NOT RUN here. Local fixtures demonstrate component/SQL behavior, not real-service acceptance. Stop at Feature 07; no email invitation platform, native review interface or subsequent feature is included.

## Suggested staging / commit

Suggested Conventional Commit: `feat(review): add scoped client review and approval`.

The exact lists above are the staging map. Features 00–06 remain dirty and review code depends on their publication/upload foundation. Review and package approved accumulated slices in dependency order; shared files/generated artifacts cannot safely be treated as a clean standalone Feature 07 baseline. No files were staged. A possible selection of new source paths, only after review, is:

```sh
git add -- apps/web/src/lib/contracts/reviews.ts apps/web/src/server/auth/review-boundary.ts apps/web/src/server/auth/review-recipient.ts apps/web/src/server/db/reviews.ts apps/web/src/server/services/reviews.ts apps/web/src/app/api/v1/reviews apps/web/src/app/reviews 'apps/web/src/app/api/v1/projects/[projectId]/deliverables/[deliverableId]/review-grants' apps/web/src/features/reviews apps/web/src/features/projects/ReviewFeedback.tsx drizzle/0009_client_review.sql drizzle/meta/0009_snapshot.json tests/unit/reviews.test.ts tests/unit/review-recipient.test.ts tests/integration/reviews.test.ts tests/e2e/client-review.spec.ts tests/browser-fixtures/client-review-entry.tsx scripts/test-client-review-harness.mjs docs/superpowers/plans/2026-11-13-client-review.md docs/development/client-review-status.md
```

Then inspect/stage the listed schema/journal/registry/publication/UI-fixture/generated/tracker changes with their dependencies. Exclude credentials, private media, unrelated `.gitignore`/`output/` work, node_modules and generated build/test output.
