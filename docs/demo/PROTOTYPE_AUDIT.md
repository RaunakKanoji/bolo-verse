# Pre-demo prototype audit

13 November 2026, Asia/Kolkata. Scope: the supplied pre-demo QA request. This is an audit of the accumulated working tree, not just committed HEAD. Existing uncommitted implementation is preserved.

## Baseline and architecture

Read `context/project-overview.md`, `context/architecture-context.md`, `context/progress-tracker.md`, `docs/product/UNIFIED_PLATFORM_SPEC.md`, `docs/architecture/system-overview.md` and the existing feature delivery reports. Actual stack: Next 16.4.6 App Router, React 19, strict TypeScript, Clerk, Neon/Drizzle, private R2, Gemini/Sarvam HTTP adapters, isolated A-Frame and direct Three.js recorder, separate R3F app. Native remains independent and does not block this audit. No Supabase implementation or working Shotstack rendering workflow was found.

The database already contains the requested logical entities through projects/members, assets, brief_versions, artifact_versions, content_versions, access_grants, review_comments/review_decisions, brainstorm_sessions/messages/ideas and workspace metadata. Reuse these; do not add duplicate domain tables. Prompt templates can be a versioned code registry. Activity is derived from persisted rows rather than a synthetic feed.

## Findings before changes

| Priority | Finding | Evidence / impact |
| --- | --- | --- |
| P0 | Live identity unavailable | Both Clerk variable names are missing. Private workflows correctly fail closed; no authenticated client/creator rehearsal is possible. |
| P0 | Private storage unavailable | R2 account/access/secret fields are missing. A bucket name alone does not establish a bucket or persisted uploads. |
| P0 | AI and STT configuration incomplete | Gemini/Sarvam key fields are present but model fields are missing. Key validity is unverified. No billed call is justified by configuration presence. |
| P0 | Client intake is incomplete | Project dialog supports basic metadata and separate versioned brief/assets; it is not the requested atomic client submission. No client-to-creator assignment UI exists. Assignment policy needs an explicit product decision. |
| P0 | Saved brainstorming ideas omitted from provider context | `server/services/brainstorm-studio.ts` sends the brief, six recent reply excerpts and current message, but excludes saved ideas. Later generation cannot reliably use selected concepts. |
| P0 | Required prompt templates absent | `features/brainstorm/BrainstormStudio.tsx` contains five plain starter strings, without identifiers, objectives, inputs or output requirements. |
| P0 | Production artifacts incomplete | Strict direction/script/storyboard/note schemas and artifact_versions exist, with sample seed data. No authoring/version retrieval endpoints or editable storyboard scene-card workflow exist. Seed rows do not prove the workflow. |
| P0 | Selected storyboard voice action missing | Creation command registry supports assets, scenes, captions, private draft and review handoff; no storyboard panel exists to open. Existing command execution and STT must be evaluated separately. |
| P0 | Review live acceptance unverified | Image publication, recipient-bound review, feedback and revision services/tests exist; no real client/creator accounts are configured. |
| P1 | Timeline incomplete | Existing activity covers project/brief/assets/review/feedback/approval/tasks, but not saved concepts or author-created scripts/storyboards. |
| P1 | Generic environment check can be misread | `pnpm env:check` validates syntax and intentionally permits missing integrations; it does not establish demo readiness. A separate fail-closed demo preflight is needed. |
| P2 | Video, advanced XR, organizations, native polish | Retain existing behavior; do not add providers or rework renderers during QA. |

## Baseline checks

Initial `pnpm check`: 732/733 tests passed; the launcher integration failed on sandbox socket bind `EPERM`. Lint/type/contracts/native drift/format checks passed before that failure; production builds were not reached. A socket-enabled rerun is recorded in TEST_RESULTS.md. This is an environment restriction, not evidence of a broken launcher; no test is skipped or weakened.

## Proposed changes and execution order

1. Add a ten-template registry under `apps/web/src/lib/contracts/brainstorm-templates.ts`; expose it in the existing Brainstorm composer. Templates remain editable prompts using existing server validation/persistence, without changing v1 wire formats.
2. Correct `apps/web/src/server/services/brainstorm-studio.ts` to supply bounded, redacted saved ideas from the authorized session; discard a response if the session changes while the provider runs. Add focused PostgreSQL/provider-boundary tests and a browser template test.
3. Add `scripts/demo-preflight.ts` and its pure configuration projection, tests and `pnpm demo:preflight`. Report variable names only, fail when required groups are incomplete, and explicitly distinguish configuration from live verification.
4. Prepare isolated, clearly synthetic Nova Coffee inputs and exact live/manual rehearsal steps without provisioning fake accounts, migrating an unknown database, uploading private files or inventing provider results.
5. Run the workspace/build/browser gates, inspect failures, fix reproducible defects, and publish all six requested reports with the sixteen acceptance criteria individually classified.

Client assignment is pending user input. Live persistence/provider/account checks remain blocked by missing credentials/models. Those blockers do not prevent local tests, navigation/rendering QA, context/template corrections or preparation of the demonstration package. Script/storyboard completion is separately identified as missing rather than silently substituted with private prompt drafts or static seed artifacts.

## QA changes delivered

The user selected one designated demo creator. Added creator-owned atomic client intake, strict MIME/extension/size checks with stable upload retries, narrow client upload authorization, submitted-v1 brief visibility, AI-visible submitted constraints, manual immutable script/storyboard/direction/note editors and history, actor-private saved-idea handoff, reviewed storyboard voice navigation, ten prompt templates, safe saved-idea AI context with atomic stale-output rejection, persisted production/concept activity, preflight and synthetic rehearsal inputs. Independent review findings were corrected and re-reviewed. Final focused SQL/unit run passed88 tests in9 files; see TEST_RESULTS.md for exact broader failures and live boundaries. Direct AI artifact generation remains unavailable. Final decision: NOT READY.
