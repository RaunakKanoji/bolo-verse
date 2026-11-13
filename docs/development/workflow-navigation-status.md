# Workflow locations and current setup

Updated 13 November 2026. This corrects navigation and the distinction between source implementation, local fixture verification and a configured usable service.

## Where the requested features are

Use the portal at **http://127.0.0.1:3000/**. Its server owns `/app`, `/reviews`, `/studio`, `/xr` and `/api`. `/workspace` forwards to the separate canonical editor. Portal page paths opened on internal port3001 now redirect to the configured portal instead of returning spatial404. The internal app does not proxy API mutations.

| Requested feature | Actual page / section | Required services |
| --- | --- | --- |
| 01 Project briefs | `/app/projects/{projectId}` → Client brief | Clerk + Neon |
| 02 Gemini brainstorming | `/studio/brainstorm` → choose editable project → Client brief / Brainstorm with Gemini | Clerk + Neon + Gemini |
| 03 Reviewed voice | `/studio/xr/{projectId}` → legacy assistant record/transcript/proposal/Apply | Clerk + Neon + Sarvam + Gemini |
| 04 Canonical spatial editing | `/workspace/{projectId}` | Clerk + Neon; R2 for private asset previews |
| 05 Image ingestion | `/app/projects/{projectId}` → Project images | Clerk + Neon + private R2 |
| 06 Publication | Same project → Published image versions | Clerk + Neon + private R2 |
| 07 Client review | `/reviews` → exact granted version | Clerk + Neon + private R2 |
| 08 Revisions | Project version feedback → select a changed image → Resubmit → explicit Share for review | Clerk + Neon + private R2 |

`{projectId}` is a real authorized project's UUID. These are project-scoped forms, not eight independent public full-screen pages. Native review UI and canonical R3F voice were not implemented in these slices. `/studio/create` provides the local image canvas; `/workspace/demo` is an explicit procedural-only demo and `/xr/preview` is a public legacy sample. None of those establishes private project/provider behavior.

## What was actually broken

- The inspected Chrome tab was `localhost:3001/app/projects`, served by the internal spatial Next server, which had no portal route. A new page-only spatial proxy now redirects known portal page paths using a validated fixed origin; it ignores caller-selected hosts and leaves APIs/spatial/assets unchanged.
- StudioShell hid the root navigation and still disabled Review as planned after Feature07 existed. Review is now an enabled link to `/reviews`.
- Brainstorm still pointed to the old XR chooser. It now opens `/studio/brainstorm`, which uses verified identity and project permissions to choose the saved-brief workflow.
- README setup still described six migrations, no uploads and the wrong canonical editor path. It now reflects migrations through0009, Project images and `/workspace`.
- `localhost:3000` reaches a separate Docker service over IPv6 in this environment. Portal uses127.0.0.1. The `.env.example` and existing ignored `.env` public origin now match it; credential fields were preserved.

## Why private workflows remain unavailable

User confirmed the services still need setup. Presence-only checks found Clerk keys, DATABASE_URL, private R2 credentials, Gemini and Sarvam settings absent. The actual portal GET `/api/v1/projects` returns `503 PROVIDER_UNCONFIGURED`: “Clerk and database configuration are required to access projects.” HTTP200 page responses containing setup notices do not establish working private workflows.

No accounts, credentials, cloud buckets/databases, real projects or private assets were provisioned. No authentication bypass, invented private data, live migration or paid provider request was added. Source/SQL/browser fixture checks cannot substitute for live creator/client acceptance.

## Connect services in dependency order

1. Configure an actual Clerk development application. Put its matching `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in the ignored local environment. Keep secrets out of chat, source and reports.
2. Configure a development Neon `DATABASE_URL`, plus `DATABASE_MIGRATION_URL` if a separate migration connection is needed. Review the ten checked-in migrations through0009 and target database; apply only with authorization. Then sign in normally and create/open a real project. Briefs can now be exercised.
3. Configure the existing private R2 bucket integration: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`; exact-origin upload CORS; no public bucket. Use Project images to upload and verify an actual image, then publish/share/review/revise it using two real accounts and a third denied account.
4. Configure `GEMINI_API_KEY` and the currently supported structured-output `GEMINI_MODEL` for brainstorming. Configure the Sarvam key/model/speaker fields for the separate legacy voice flow. Entering settings alone does not prove successful calls.
5. Keep `NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000` and trusted origins aligned, run `pnpm env:check`, restart `pnpm dev` after configuration, then verify real account flows. Environment syntax validation permits missing integrations and is not a readiness pass.

Use the existing `.env.example` as the key inventory; edit the ignored `.env` or `.env.local` without overwriting existing secret-bearing files. The actual account setup and live workflow verification remain unfinished. See the individual Feature01–08 delivery reports for API/security/manual acceptance detail.

## Verification

- PASS: eight focused redirect/gateway/server-boundary unit cases; the three navigation browser regressions failed before implementation.
- PASS: initial workspace gate, 645 tests/68 files and both production builds; 23 focused browser cases; all121 Chromium cases/17 files before final reviewer corrections (`/tmp/shape-navigation-full.log`, exit0,3.3min).
- PASS: final `pnpm check`,646 tests/68 files, all14tasks and both production builds, exit0,39.718s (`/tmp/shape-navigation-final-check.log`). Final focused unit/SQL checks passed26 cases/four files. Final navigation/brief browser checks passed15 cases/two files, exit0,34.5s (`/tmp/shape-navigation-final.log`). Together with the prior full run,122 distinct browser cases were exercised; the whole suite was not repeated after the two focused corrections.
- PASS: independent review found a late-mounted Brainstorm fragment and ineligible read-only choices. Regressions failed before their fixes and passed afterward: stable anchor now exists on the initial brief section; chooser SQL uses existing editor permission. No invented authorization or client role filtering.
- PASS: actual `http://127.0.0.1:3001/app/projects` changed404→307 to the configured portal, preserving page path/query. Portal redirects render the genuine setup notice; private API remains503/unconfigured. Final whitespace/staging checks passed, no index changes.
- NOT RUN: live account/provider/private-storage acceptance; required services absent. No migration/deployment/staging/commit performed. Earlier dirty work preserved.

Changed source: spatial `src/lib/portal-target.ts`, `src/proxy.ts`; web `StudioShell.tsx`, `ProjectBrief.tsx`, new `app/studio/brainstorm/page.tsx`, project-list filtering in `server/db/projects.ts`. Tests: spatial `portal-target.test.ts`, `tests/e2e/portal-navigation.spec.ts`, `project-briefs.spec.ts`, `tests/integration/project-access.test.ts`. Documentation/config: `.env.example`, README, demo runbook, both trackers and navigation-recovery plan. No new dependency/schema/shared contract/native changes.
