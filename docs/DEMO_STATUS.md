# Feature 00 — repository baseline and demo safety

Updated 13 November 2026, Asia/Kolkata. Implements only `context/feature-specs/00-repository-baseline.md`. [Implementation map](superpowers/plans/2026-11-13-repository-baseline.md) · [Current demo runbook](DEMO_RUNBOOK.md).

## Scope and checkpoint inventory

The three-application migration is already committed on local `main` at `0036c313`; there were not 362 dirty files. At inspection there was one modified tracked file (`.gitignore`, two pre-existing ignore entries) and 15 untracked generated design files under `output/`. All 16 files were hashed for preservation; none belongs in a baseline checkpoint. No migration was dirty and no baseline change adds a dependency, table, renderer or native contract.

While verification ran, separate project-brief edits appeared: `apps/web/src/lib/contracts/documents.ts`, new brief contracts/repository/routes, their tests and `docs/superpowers/plans/2026-11-13-project-briefs.md`. They are concurrent work outside Feature 00, preserved and excluded from the suggested checkpoint. Do not stage the whole tree.

Potential secret-bearing locations are ignored root `.env*` and native `Config/Local.xcconfig`; only variable presence was inspected. No secret values were printed. Generated concept media/prompts were not staged or published.

## Implemented changes

- `apps/web/src/xr/assistant/AssistantPanel.tsx`: confirmation now says **“Reset and save the default workspace layout? This replaces your saved layout and current unsaved arrangement.”** Existing reset implementation is unchanged. Keep layout only dismisses the proposal; confirm uses the authorized persisted reset endpoint.
- `apps/web/src/app/api/projects/route.ts` and `[id]/route.ts`: legacy list/read/create/update reuse existing `projectSummary`. Responses keep id/name/objective/sample/createdAt, envelope, status and no-store policy; creator/workspace IDs stay server-side. Actual legacy UI consumer `ProjectForm` requires the unchanged project ID. Repository ownership/membership fields remain intact in SQL.
- `tests/integration/project-access.test.ts`, `project-mutations.test.ts`: compatible public projections, create/update/reopen, strict input/body/Origin/auth checks, and ownership asserted from persisted SQL rather than leaking API fields.
- `tests/e2e/xr-workspace-editing.spec.ts`: actual assistant proposal/confirmation, raw reset POST count, cancellation with saved and unsaved transforms unchanged, confirmed persisted reset and reload.
- Demo runbook, this status, root `progress-tracker.md` and implementation map record the baseline and open acceptance. No future feature is implemented here.

## HTTP behavior

Existing browser-cookie mutation policy is retained: Clerk identity, exact trusted Origin, strict bounded Zod input, SQL project authorization, durable creation budget and sanitized errors. V1 bearer policy and canonical scene revision CAS are untouched.

Example authenticated `POST /api/projects` body: `{"name":"Launch","objective":"Introduce the product"}`. A successful 201 response remains `{"ok":true,"data":{"project":{"id":"UUID","name":"Launch","objective":"Introduce the product","sample":false,"createdAt":"ISO_DATE"}},"requestId":"REQUEST_ID"}`. PATCH accepts only name/objective. The placeholders are illustrative, not a created project or live response. Forbidden callers receive no project metadata.

## Verification record

| Result | Gate / command | Evidence |
| --- | --- | --- |
| PASS | `node --version`, `pnpm --version` | Node v24.22.0, pinned pnpm 11.12.0 |
| PASS | Before changes: `pnpm lint`, `pnpm typecheck` | Both exit 0; `/private/tmp/shape-baseline-before-lint.log`, `shape-baseline-before-types.log` |
| PASS | Before changes: `pnpm check` | 14 tasks, 523 tests/54 files, both builds; `/private/tmp/shape-baseline-before-check.log` |
| FAIL → PASS | Projection regression | Raw legacy rows exposed creator/workspace IDs; new strict projection checks failed before fix. Four focused SQL suites subsequently pass 100 tests, including existing scene CAS and versioned APIs; `/private/tmp/shape-baseline-focused-sql.log` |
| FAIL → PASS | Assistant reset regression | Old copy omitted persistence; new test failed on exact rendered disclosure, then passed confirmation/cancel/save/reload; `/private/tmp/shape-baseline-reset-red.log`, `shape-baseline-reset-green.log` |
| FAIL → corrected | First post-change full suite | Five existing mutation assertions depended on raw internal response fields. Tests now inspect ownership through SQL joins, preserving those invariants |
| FAIL | Subsequent `pnpm check` during concurrent brief work | `tests/unit/project-briefs.test.ts` — “preserves rich legacy fields and accepts bounded authoring metadata”; 536 tests passed, one failed. That file is outside Feature 00 and was not edited; `/private/tmp/shape-baseline-concurrent-brief-failure.log` |
| PASS | Development startup/HTTP inspection | Actual portal `/`, `/studio/create`, `/app/projects` and gateway `/workspace` respond 200 at 127.0.0.1:3000. Internal spatial app is port 3001 |
| FAIL → corrected setup | Initial browser invocation pointed at 3001 | Internal R3F `/` returns 404; Playwright attempted an occupied portal port. Using the actual public portal fixed test startup; no server replacement or startup-code change needed |
| NOT RUN | Live creator creates/reopens project and persists ready-asset canonical scene | No real Clerk session/database/private asset configuration is present. SQL and browser fixtures are separate evidence |
| NOT RUN | Hosted deployment / physical browser headset / new native verification | Outside this baseline; no external mutation performed |

Final verification:

| Result | Gate / command | Evidence |
| --- | --- | --- |
| PASS | `pnpm build` | Both production applications compiled; `/private/tmp/shape-baseline-final-build.log` |
| PASS | Final `pnpm check` | All 14 tasks, 551 tests across 56 files and both builds; includes concurrent brief work as it existed at this final run. `/private/tmp/shape-baseline-acceptance-check.log` |
| PASS after isolated rerun | `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3170 pnpm exec playwright test tests/e2e/foundation.spec.ts tests/e2e/spatial-workspace.spec.ts tests/e2e/xr-workspace-editing.spec.ts` | 26 cases passed in the first run. The remaining scene conflict/reload case failed at browser-context teardown because a shared trace `.network` file disappeared; no application assertion failed. With `PLAYWRIGHT_OUTPUT_DIR=/private/tmp/shape-baseline-isolated-browser-results`, that case passed. All 27 distinct cases passed across the run/rerun; `/private/tmp/shape-baseline-browser.log`, `shape-baseline-browser-retry.log` |
| PASS | Manual Chrome gateway navigation | Public `/workspace` rendered the R3F entry; Choose a project reached `/app/projects` and the explicit unconfigured setup notice. No real account sign-in claimed |
| PASS | Actual development private-API requests | Legacy/v1 projects and canonical scene returned `503`, `PROVIDER_UNCONFIGURED`, `ok:false`, `Cache-Control:no-store`; no private payload printed |
| PASS | `git diff --check`, scoped review and preservation hashes | All 16 original dirty files unchanged; independent review found no material findings. No index changes made |

The intermediate brief failure is preserved above; its concurrent implementation changed before the final green run. No brief code was edited by Feature 00. Temporary production servers on 3170/3171 are stopped after verification; existing development servers are preserved.

## Minimum live prerequisites and acceptance decision

Missing identity/project variables: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`. Ready-asset reads also need `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`. Configure them locally, use the correct trusted public origin, provision real development creator/client accounts and a ready supported asset in the intended project. Operator-reviewed migration/application is separate; none was run here.

The **live persisted-demo acceptance gate is blocked**, not passed through fixtures. Stop at Feature 00. Do not start briefs, brainstorming, voice or publication work to fill this gap.

## Suggested checkpoint — not executed

Review and stage only the three runtime files, three changed test files, `docs/DEMO_RUNBOOK.md`, `docs/DEMO_STATUS.md`, `docs/superpowers/plans/2026-11-13-repository-baseline.md` and root `progress-tracker.md`. Exclude `.gitignore`, `output/` and concurrent brief changes.

Suggested paths, after review (not executed):

```sh
git add -- apps/web/src/app/api/projects/route.ts \
  'apps/web/src/app/api/projects/[id]/route.ts' \
  apps/web/src/xr/assistant/AssistantPanel.tsx \
  tests/integration/project-access.test.ts \
  tests/integration/project-mutations.test.ts \
  tests/e2e/xr-workspace-editing.spec.ts \
  docs/DEMO_RUNBOOK.md docs/DEMO_STATUS.md \
  docs/superpowers/plans/2026-11-13-repository-baseline.md progress-tracker.md
```

Suggested commit: `chore(repo): establish verified hackathon baseline`. No staging, commit, push, live migration or deployment was performed by this feature. Rerun the gate if concurrent work changes, and complete live acceptance before claiming a verified live demo.
