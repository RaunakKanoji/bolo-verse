# Feature 08 — revisions and resubmission

**Spec:** `context/feature-specs/08-revisions.md`. Implement inline, preserve dirty Features 00–07, no staging/commit/push/live migration/deployment. The user's ordered implementation protocol supplies execution authorization; no additional design approval is required.

## Implementation map and decisions

Existing publication verifies real ready uploaded bytes and locks the project for unique immutable version numbers and UUID retries. Existing decisions/comments are immutable; exact-version review grants are explicit and independent. Missing: a parent/decision-bound revision, stale competing-child rejection, revision action/context and per-version client history.

Extend the existing strict publication request with optional `revision: {supersedesVersionId, expectedVersion, expectedDecisionId}`. Store that immutable relationship in optional v2 uploaded-image provenance, preserving legacy v1 and non-revision requests. Reuse POST deliverables; no new table/dependency/migration. Alternatives (new revision table/service or automatically rebinding grants) duplicate existing models or violate the explicit-grant boundary.

Revision parent must be a same-project published uploaded image with the exact expected version and latest immutable terminal decision (`changes_requested` or `approved`). Only one direct successor is allowed; project serialization protects this rule. Exact successful retries run before stale checks, so retrying v2 after v3 is safe. Require different asset identity AND checksum from parent, with full existing upload/byte verification; no fabricated ready row or local edit claim. Check before storage and inside final transaction; final SQL permission predicate is retained. Parent revision/decision stays unchanged. New publication carries no decision or grant. Existing Share for review explicitly submits v2, including to the prior reviewer.

Creator version history shows parent relationship, persisted decision/pending/not-shared status and Resubmit selected image on reviewed versions. Existing upload/gallery selects a new image before resubmission. Reuse the retained-input publication dialog with parent/decision context and stable retry key. Older-version expandable feedback retains the same controls. Client detail shows only actively granted same-project version history and each own decision; inbox remains exact-grant scoped. A reviewer never sees an ungranted v2 or ungranted old metadata.

## Target files

- Modify `apps/web/src/lib/contracts/deliverables.ts`, `server/db/deliverables.ts`, `lib/contracts/reviews.ts`, `server/db/reviews.ts`.
- Modify `apps/web/src/features/projects/ProjectDeliverables.tsx`, `ReviewFeedback.tsx`, `features/reviews/ClientReview.tsx`; existing CSS only if required.
- Add `tests/integration/revisions.test.ts`; extend focused contract tests and browser `deliverables.spec.ts`/`client-review.spec.ts`.
- Regenerate OpenAPI/TS/Swift/native copies; extend Swift fixtures. Add this plan/report and update both trackers. No scene/editor/native UI changes.

## Tasks and verification

- [x] Add failing strict request/provenance tests and disposable SQL behavior tests: changes requested/approved→v2, immutable v1/hash/comments/decision, no carried grant/approval, explicit v2 grant, stale decisions, conflicting children, exact concurrent retry, foreign/non-ready/same bytes, actor/Origin/body checks, refresh and post-storage authorization.
- [x] Implement the repository/contract slice, generate synchronized artifacts and run focused publication/review/revision checks.
- [x] Add failing browser cases: context→new selection→resubmit, retained retry, old trail plus v2 pending after explicit share, sorted/reloaded scoped timeline. Implement additive UI with existing cleanup/denial behavior.
- [x] Independent code/security review and regressions for material findings.
- [x] Run `pnpm check`, full Chromium, Swift contracts/native tests and unsigned checked-in visionOS Simulator build. Inspect desktop/mobile screenshots and whitespace/staging/source diff.
- [x] Record exact paths/APIs/security/PASS/FAIL/NOT RUN/manual demo/staging/commit in `docs/development/revisions-status.md`; update both trackers. Real accounts/Neon/R2 remain NOT RUN without credentials and approved setup. Stop at Feature 08.

## Review focus

- Actor loses editor permission or a new parent decision/successor appears during storage verification: reject final publication with no extra row.
- A different uploaded asset with identical bytes is insufficient; the verified parent hash must change.
- Concurrent distinct keys cannot fork a parent; same-key retries converge and work after later revisions.
- V2 is pending only after its explicit grant; v1 terminal decision stays on v1 and never authorizes v2.
- Review history filters each active identity grant, including old-version revocation; session loss aborts and clears late private history/media.

## Execution ledger

- PASS: final focused publication/review/revision/image checks, 63 tests/five files. Final `pnpm check`: 14 tasks, 642 tests/67 files, both builds, 41.43s. Full Chromium: 118 cases/16 files, 3.6m.
- PASS: generated artifacts/native copies synchronized; 31 Swift round trips/nine invalid payloads, 48 native core tests/nine suites, unsigned generic visionOS Simulator Xcode compilation. No native interaction/device claim.
- PASS: independent code/security review, desktop/mobile screenshots, final whitespace/source/staging review. Review found an early history grant could be revoked while later entries loaded; actual disposable SQL regression failed with `[2,1]`, passed with `[1]` after a final batch active-subject grant filter.
- Ruling: reuse immutable v2 JSON provenance for the relationship, and require a different verified ID/hash rather than imposing upload timestamps — fits existing models and permits selecting an already verified revised image. No migration needed.
- Ruling: publish revision and explicitly share it as separate existing actions — avoids implied grant inheritance and permits creator review before client submission. Client sees Pending review only after actual sharing.
- NOT RUN: real-account v1 change request→new private R2 upload→v2 explicit review, third-account live denial, live Neon interleavings and physical/native review. Required Clerk/database/R2 configuration/accounts absent. Existing migration0009 requires separate authorization; Feature08 adds none. No staging, commit, push, deployment, cloud/account mutation or live migration.
- Exact files, API examples, security, failure history, manual demo and suggested staging/commit: [delivery report](../../development/revisions-status.md).
