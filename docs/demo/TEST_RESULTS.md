# Pre-demo test results

13 November 2026, Asia/Kolkata. This ledger distinguishes baseline, final-tree, fixture and live evidence.

| Gate | Result / evidence |
| --- | --- |
| Baseline `pnpm check` under sandbox | 732 passed, one launcher socket-bind EPERM. `/private/tmp/shape-pre-demo-baseline-check.log`. No assertion was weakened. |
| Socket-enabled baseline `pnpm check` | **PASS**: 14 tasks, 733 tests/81 files, both production builds. `/private/tmp/shape-pre-demo-baseline-check-unsandboxed.log`. This predates the QA changes. |
| Brainstorm regression red run | Missing saved context and stale session output reproduced before fix; missing registry test also failed. `/private/tmp/shape-pre-demo-context-red.log`. |
| Brainstorm/preflight focused green | **PASS**16 tests across three files before later intake/timeline integration. `/private/tmp/shape-pre-demo-focused.log`. Provider responses are HTTP mocks. |
| Long-secret regression | **FAIL before fix**: truncated PEM sent unredacted. Redaction now occurs before excerpt truncation; subsequent focused context suite passed. `/private/tmp/shape-pre-demo-redaction-red.log`. |
| Preflight/voice grammar | **PASS**25 tests across two files at that stage. `/private/tmp/shape-pre-demo-preflight-voice.log`. Storyboard command failed before implementation. |
| Final focused integration/unit gate | **PASS: 88 tests in 9 files**, including repaired intake ownership/uploads/brief visibility, artifact isolation/history, client reviews, Brainstorm context, timeline, templates and preflight/commands. `/private/tmp/shape-pre-demo-final-focused.log`. SQL and external HTTP fixtures, not live acceptance. |
| Client intake initial browser coverage | Three isolated Chromium cases passed before the ownership repair; final combined browser rerun not completed. |
| Production artifacts SQL | Seven cases included in the final passing focused gate. Three new artifact browser cases remain unverified. |
| New read-only-client review regression | **FAIL before fix**409 rather than201; existing restriction rejected every project member. Changed to reject editing roles, preserving explicit grants. Final focused gate passed. |
| Timeline regression | Missing production/own-concept events reproduced. Later run hit a30s migration hook timeout during resource contention. Final focused gate passed. |
| Broad Chromium sweep | **Incomplete**:115 passed, four timed out,54 not run after intentional interruption. `/private/tmp/shape-pre-demo-browser.log`. Fullscreen click and three canonical spatial cases need isolated rerun. No complete suite pass is claimed. |
| Synthetic input generation | **PASS**: one-page PDF and two640px PNG references generated, PDF extracted and rendered for visual inspection. `/private/tmp/shape-pre-demo-brief.png`; inputs under `output/demo/nova-coffee/`. No provider/account/DB call. |
| Dependency consistency | **FAIL/BLOCKED**: isolated frozen manifest check found concurrent `@shotstack/shotstack-studio@2.31.0` addition absent from lockfile. User chose to let dependency work finish first. In-place install also refused noninteractive module removal; no purge was forced. |
| Final lint | Direct ESLint completed with no diagnostics; `/private/tmp/shape-pre-demo-final-lint.log`. Whitespace check passed. |
| Final changed-tree `pnpm check` | **FAIL/BLOCKED**: spatial TypeScript cannot resolve `@clerk/nextjs` after concurrent dependency installation. Seven tasks completed; full tests/builds were not reached. `/private/tmp/shape-pre-demo-final-check.log`. |
| Final isolated browser rerun | **NOT RUN**: automatic permission approval review timed out before the command started. New actual-storyboard voice browser case remains unverified. |
| Shared/native contracts | **PASS**: six contract artifacts synchronized, three native copies checked; Swift 6 typecheck, 48 bidirectional fixtures and 9 invalid payloads passed. No new native app/device verification. |
| Live Clerk/Neon/R2/Gemini/Sarvam | **NOT RUN / BLOCKED** by missing configuration, account sessions and models. Present key/URL fields are unverified. No live migration, provider request, storage mutation or deployment. |
| Physical microphone/WebXR/native device | **NOT RUN**. Synthetic browser MediaRecorder input and mocked STT are separate from real recognition; no headset is required for desktop fallback. |

## Test commands after environment stabilization

```sh
pnpm install --frozen-lockfile --offline --ignore-scripts
pnpm check
pnpm native:check
pnpm exec playwright test
pnpm demo:preflight
```

Focused new suites: `tests/unit/brainstorm-templates.test.ts`, `tests/unit/demo-preflight.test.ts`, `tests/unit/project-submissions.test.ts`, `tests/unit/creative-actions.test.ts`, `tests/integration/{brainstorm-studio,project-submissions,production-artifacts,workspace,reviews}.test.ts`, `tests/e2e/{brainstorm-studio,project-submissions,production-artifacts,creation-voice}.spec.ts`.

No test injects a production authentication bypass. PGlite exercises actual migrated SQL with isolated identities/storage/provider boundaries. Browser HTTP fixtures establish UI behavior, not hosted integration or generated media provenance.

## Git packaging

No QA commits were created. Changes remain in the shared working tree; prior uncommitted feature work was preserved. The final dependency/build gate is blocked, so no broad staging, merge, push or deployment was performed. Recommended later checkpoints: intake/permissions; production artifacts and voice handoff; Brainstorm context/templates; demo tooling/reports. Review dependencies on pre-existing uncommitted files before staging.
