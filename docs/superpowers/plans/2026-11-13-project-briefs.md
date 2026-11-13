# Project Briefs Implementation Plan

**Goal:** Implement only [Feature 01](../../../context/feature-specs/01-project-briefs.md): authorized, editable, versioned briefs on existing projects.

**Architecture:** Keep the existing rich brief payload and immutable version rows. Add optional metadata to that payload, share strict request/result schemas, and lock the authorized project row while checking expectedVersion and inserting one new brief version. A UUID idempotencyKey becomes the existing version primary key; reuse with another payload, actor or project returns generic 409. No new dependencies, tables or migration. Existing canonical scene and native contracts remain unchanged.

**Implementation map / current behavior:** `documents.ts` already validates objective/audience/product/format/aspect/tone/language/facts/prohibited claims/constraints. `brief_versions` has unique project/version and primary-key identity, but no authoring service/routes/UI. `projects.ts` supplies SQL authorization, `api-identity.ts` supplies Clerk cookie/bearer policy, `mutations.ts` supplies trusted Origin and bounded JSON, and `errors.ts` sanitizes failures. The project page has editable metadata and studio links. No graph index exists; targeted source lookup used.

**Files:** Extend `apps/web/src/lib/contracts/documents.ts`; create `lib/contracts/project-briefs.ts`, `server/db/project-briefs.ts`, `app/api/v1/projects/[projectId]/brief/route.ts`, `features/projects/ProjectBrief.tsx`; integrate project page; add scoped styles. Add `tests/unit/project-briefs.test.ts`, `tests/integration/project-briefs.test.ts`, isolated browser harness/entry and `tests/e2e/project-briefs.spec.ts`. Update `context/progress-tracker.md` and delivery documentation. Publish additive OpenAPI/client artifacts only if supported without changing old v1 schemas.

**Security:** Persisted creator/editor or workspace owner writes. Assigned clients read approved versions only, never internal proposed drafts through the new route. Unrelated and missing IDs both return 403 per repository convention. No author IDs, memberships or private keys in response. No automatic approval, external calls, commits, deployments or live migrations.

**Review focus:** Retry after ambiguous network save must reuse the same request; stale edits retain local text; reload never silently discards dirty fields; approved client summary must not expose a newer draft; missing/unauthorized IDs must not become an existence oracle.

- [x] Contract cycle: test old rich payload compatibility, metadata bounds, URL/date safety and deterministic AI serialization; run red; implement; run green.
- [x] SQL/API cycle: tests for save/read, editor/owner, client approved-only, unrelated/missing, input/Origin/identity/body bounds, retry/mismatched retry and competing writes; run red; implement locked version insert; run green.
- [x] Browser cycle: tests for load/prefill/save/reload, validation, network retry, 409 recovery, read-only and unsaved warnings; implement form and isolated fixture; run Playwright.
- [x] Verification: pnpm check, focused and full tests, relevant browser regression, native artifact drift, git diff --check, scope/secret review. Record PASS/FAIL/NOT RUN honestly; live account demo remains NOT RUN without explicit live credentials setup.

**Workspace:** Work in requested checkout, preserve all initial dirty files. No git operations that discard, stage or commit work.

## Delivery ledger

All planned local implementation and checks were executed. See [delivery evidence](../../development/project-briefs-status.md) for commands, results and exact file paths. Independent review identified role-downgrade clearing, legacy multiline preservation and aggregate UTF-8 validation; all were fixed with observed failing/passing regressions and re-reviewed. Malformed URL and network recovery failures were also corrected. Final workspace gate: 14 tasks, 551 tests/56 files and both builds PASS. Brief browser: 11/11; broader regression: 33/33 including ten repeated brief cases, giving 34 distinct cases. Swift contract fixtures and 48 native core tests PASS. Unsigned generic visionOS Simulator app build PASS after host disk recovery; live accounts/demo NOT RUN. No commit, push, external migration or deployment.

Ruling: approved-only project-client reads follow the feature's draft-privacy requirement; adding approval authoring remains out of scope. Ruling: use the existing version primary key for idempotency to avoid unnecessary migrations. Ruling: retain work in the requested shared checkout, preserving all existing/concurrent dirty files; no worktree, staging or commit was performed.
