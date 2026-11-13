# Feature 00 repository baseline implementation map

**Goal:** Implement only repository baseline/demo safety from `context/feature-specs/00-repository-baseline.md`; preserve the current tree and stop at its acceptance boundary. Do not commit, push, migrate or deploy.

**Existing implementation:** Three-application migration is already committed on `main`. The Next web gateway forwards `/workspace*` to R3F; server transport forwards only cookie/authorization to an exact configured backend origin. Existing Clerk identity, strict mutation input, trusted-Origin rules, SQL project permissions and canonical scene revision CAS are retained. V1 project routes already reuse `projectSummary`; legacy routes return raw repository rows. The assistant reset command uses a separate confirmation before calling the persisted reset handler, but its copy mentions only an unsaved arrangement.

**Current inventory/checkpoint:** Pre-existing dirty paths are `.gitignore` and generated concepts under `output/`. Preserve both. No migration files are dirty. Keep those paths outside any future baseline checkpoint; review a path-specific diff of this feature, then suggest `chore(repo): establish verified hackathon baseline` without executing it. Never stage all untracked output. Local environment files and native local configuration can contain secrets and remain ignored; report names/presence only.

**Before-change evidence:** Node v24.22.0, pnpm 11.12.0. Root lint/typecheck and `pnpm check` pass; 523 tests/54 files, 14 graph tasks, both browser builds. Logs are under `/private/tmp/shape-baseline-before-*`. There is no existing graphify corpus; targeted source searches suffice for these bounded changes.

**Target files and tasks:**

- [x] `tests/e2e/xr-workspace-editing.spec.ts`: exercise the actual assistant proposal, assert that confirmation explicitly resets/saves the persisted default and replaces saved/unsaved arrangements, cancel without a reset POST, then confirm/save and reload. Observe the old copy fail before editing `apps/web/src/xr/assistant/AssistantPanel.tsx`.
- [x] `tests/integration/project-access.test.ts` and `tests/integration/project-mutations.test.ts`: real local PostgreSQL compatibility cases for legacy list/read/create/update response keys, validation/identity/origin/roles and reopen. Observe internal field exposure fail, then reuse `projectSummary` in `apps/web/src/app/api/projects/route.ts` and `apps/web/src/app/api/projects/[id]/route.ts`. Keep envelope, public project fields, status codes and authorization unchanged.
- [x] Reuse existing canonical scene SQL/browser cases for persistence, refresh, stale revision, denied user and failed-network recovery. Verify gateway public/private paths against both actual apps. Do not add a fake account or bypass to make live acceptance appear green.
- [x] Update `docs/DEMO_RUNBOOK.md` and create `docs/DEMO_STATUS.md`: actual URLs, exact prerequisites, accounts unavailable, 90-second sequence, commands and PASS/FAIL/NOT RUN evidence. Correct stale migration/renderer statements in the demo instructions only. Update the requested root `progress-tracker.md`, preserving historical entries.
- [x] Run focused SQL/browser cases, full `pnpm check`, relevant actual browser inspection and `git diff --check`. Verify pre-existing file hashes are unchanged; review only the intended diff. Report live account/ready-asset acceptance as NOT RUN if configuration remains absent.

**Dependencies/migrations:** None added. No canonical v1/native/renderer changes. Missing `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL` and R2 account/access/secret/bucket configuration block real account/project/ready-asset acceptance, not isolated code fixes. Test identities and local PostgreSQL/HTTP fixtures are never live account evidence.

**Review focus:** Persisted reset cancellation must make no mutation; raw project metadata must stay server-side; safe projections must preserve existing callers; unauthorized/network errors must retain saved data; no pre-existing changes may be lost or committed.


**Concurrent verification note:** Separate Feature 01 brief files appeared after the initial snapshot. They are preserved, outside this implementation and excluded from any suggested checkpoint. An intermediate full check failed one brief authoring unit case; later verification records its actual state separately. Initial browser testing against internal spatial port 3001 was corrected to the public portal. A concurrent Playwright run removed a shared trace artifact; rerun the affected case with `PLAYWRIGHT_OUTPUT_DIR` pointing to an isolated temporary directory rather than changing application behavior.
