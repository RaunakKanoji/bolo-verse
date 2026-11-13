# Authenticated version-scoped client review implementation plan

> **For agentic workers:** Inline execution, focused behavioral tests, independent review. Preserve all existing dirty Features 00–06. No staging/commit, live migration, account mutation, invitation delivery or deployment.

**Spec:** `context/feature-specs/07-client-review.md` (the request's escaped dot resolves to this existing file).

**Goal:** A verified non-member client can review only an explicitly assigned published image version; creators see immutable persisted feedback.

## Implementation map and policy

- Existing `access_grants` binds content/project but lacks recipient identity; project client membership exposes unrelated ready assets. Reuse the grant table, add nullable `reviewer_clerk_id`, a review-only check and one active identity-bound reviewer per version. Legacy token grants remain valid in storage but are never accepted by this identity-only flow. No invite token/email/redemption/public link.
- Add nullable `review_grant_id` FKs to existing comments/decisions, a unique terminal decision per version/reviewer for new grants, and an append-only comment trigger. Keep existing immutable decisions/content/assets and old timecode columns. Generate and review migration0009/snapshot/journal; never apply to live DB. No new table/dependency.
- Creator-authorized Share for Review accepts a Clerk user ID, UUID retry key and bounded expiry (default7 days/max30). Authorize before Clerk user lookup; verify actual recipient via server-only Clerk API, then reauthorize inside project-locked grant insert. Reject recipients with existing project privileges so the review action cannot claim restricted access for a broad member. Do not create membership. Revoke is explicit/idempotent; expired assignments can be replaced, old history remains.
- Reviewer GET inbox/detail and content route resolve only active/unexpired exact-version grants bound to verified subject and published uploaded-image versions. Return minimal metadata, scoped preview URL and that reviewer's feedback, no source asset IDs/briefs/chats/editor data. Generic project/asset APIs retain existing membership rules and do not accept these grants.
- Bounded review content reads validate actual bytes/hash and recheck grant after R2 latency and at each delivery chunk. Use zero-prefetch streaming and sanitized errors; no signed/public R2 URL or raw key is returned.
- Comments/decisions accept `{grantId,expectedVersion,idempotencyKey,...}`. Transactionally lock the grant, validate subject/expiry/version, apply durable action quota and append existing rows. Exact retries reuse row ID; mismatched reuse409. One terminal decision (`approved` or `changes_requested`) per reviewer/version; different-key duplicate/conflicting decisions409. Comments are accepted before a terminal decision. New decisions require a new published version; old granted versions remain readable until expiry/revocation.
- Add `contracts/reviews.ts`, `server/db/reviews.ts`, `server/services/reviews.ts`/recipient verification and collection/detail/comment/decision/content routes under `/api/v1/reviews`; creator grant/feedback/revoke routes under existing project deliverable routes.
- Add session-scoped reviewer inbox/page at `/reviews` and `/reviews/[versionId]` with bounded preview, comments, decisions, loading/error/denial states. Add creator `ReviewFeedback.tsx` inside published version history, Share/expiry/revoke and latest persisted feedback after refresh. No sending notifications.
- Extend shared API registry and generate TS/OpenAPI/Swift/native copies and fixtures. No native UI, scene v1 or renderer changes.
- Add focused unit/PGlite/browser tests and isolated reviewer HTTP harness. Update both trackers and delivery report with exact files, API/security/transitions/migration/live prerequisites and manual demo.

## Review focus

- A grant never creates broad project membership; reviewer cannot read generic asset, brief, draft, generations, unrelated/old ungranted version or editor mutation.
- Revoked/expired grants reject both reads and writes, including during R2 delay and when bytes are pulled after response construction.
- Mutations bind exact grant/version/subject; successful retries do not duplicate append-only rows and terminal decisions cannot silently change.
- Creator Share verifies a real recipient only after authorization and repeats authorization after network latency; no actor, token or key injection.
- UI request/session/grant/version changes clear private state and discard late results; failed comments/decisions retain retry inputs, independent old versions remain scoped.

## Task 1: contracts, migration and repository

- [x] Write failing strict-contract and PGlite tests for scoped grant creation/expiry/revocation, role/resource matrix, zero membership, comment/decision idempotency/transitions/immutability, stale version and protected byte delivery.
- [x] Implement the single identity-bound flow and generate/review additive SQL migration, preserving legacy tables/fields/triggers.
- [x] Add API registry/fixtures; regenerate synchronized artifacts and run focused checks.

## Task 2: client and creator UI

- [x] Add failing browser tests for inbox/version preview, comment/decision/refreshed feedback, explicit share/revoke, denied/expired/revoked states, retries and session/unmount cleanup.
- [x] Implement narrow reviewer page and creator feedback panel using existing design/HTTP conventions, no broad memberships or public tokens.
- [x] Verify reviewer/creator flows with isolated HTTP fixtures and inspect desktop/mobile screenshots.

## Task 3: acceptance

- [x] Independent security/code review and regressions for material findings.
- [x] Run pnpm check, full Chromium, Swift contract/native tests and unsigned checked-in visionOS Simulator project compilation for generated additions; whitespace/staging/diff review.
- [x] Record PASS/FAIL/NOT RUN, exact files/APIs/security/migration/manual demo/staging paths and commit suggestion. Live two-account Clerk/Neon/R2 acceptance remains NOT RUN without configuration/accounts. Stop at Feature07.

## Execution ledger

- PASS: 55 focused review/publication/image unit/SQL cases; final `pnpm check` 14 tasks, 631 tests/66 files and both builds (40.67s); full Chromium 115 cases/16 files (3.9m).
- PASS: generated contracts/native copies synchronized; 28 Swift bidirectional fixtures/nine invalid payloads; 48 native core tests/nine suites; unsigned generic visionOS Simulator Xcode build. Compilation is not device interaction.
- PASS: independent backend/UI review, desktop/mobile screenshots, final whitespace/diff/staging review. Final SQL authorization and older-version revoke regressions failed before their fixes and passed afterward.
- NOT RUN: real creator/client approval and third-user API/media denial; Clerk/database/R2 configuration and accounts are absent. Migration0009 was tested only in disposable SQL. No live migration, external account mutation, email, deployment, staging, commit or push.
- Full file/API/security/migration evidence, exact commands, manual prerequisites and suggested staging/commit: [delivery report](../../development/client-review-status.md).
