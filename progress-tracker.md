# Shape Studio progress tracker

Updated 2026-11-13 (Asia/Kolkata).

## Local Docker storage, native startup and icon — 13 November2026

User selected local Docker instead of R2. SeaweedFS4.53 is running with a private development bucket and server-only generated credentials in ignored `.env.local`. Existing S3 upload/preview/recording/cleanup paths now use the selected transport; real application signed PNG PUT/readback/SHA256/immutability/private-access checks pass. R2 cloud setup is superseded locally, without deleting compatibility or changing other containers. Added matching lavender shape icons and compiled/installed/launched native Shape Studio; simulator screenshot confirms its workspace is visible.

Native arm64 build, icon catalog/metadata, local raw S3 and app transport checks passed. Focused storage/env/provider tests passed29 cases; broad SQL hooks hit resource timeouts. Full workspace verification reached10successful tasks, then failed on unrelated TS2353 in `tests/integration/production-artifacts.test.ts:327` (extra `role` property); this separate feature was left unchanged at the user's quick-finish request. Scoped storage lint passes. No complete current pnpm/build/browser pass is claimed. Docker S3 HTTP remains verified; daemon control liveness, restart persistence, live Clerk/Neon and physical device checks remain open. No staging/commit/cloud write/migration/deployment. [Details and evidence](docs/development/local-object-storage-status.md).

## Private R2 storage preparation — 13 November 2026

Installed the official Cloudflare, cf-cli and Wrangler skills at pinned source commit `cbf893b954222276bf1af57e5f23379231e0efb9`. Prepared `infra/r2/bucket-plan.json`, exact-origin dashboard CORS and equivalent Cloudflare CLI/API CORS for one private development bucket, `shape-studio-dev-assets`. Added only missing R2 fields to ignored `.env.local`; existing settings were preserved. The proposed bucket name is not evidence of creation. Docker availability was checked; no containers were started or changed. Existing R2 upload/authorization/preview code and dependencies are unchanged.

Validated JSON, matching CORS representations/upload headers, ignored environment file and whitespace; official CLI bucket-create and CORS-update dry runs passed using a fictitious account ID. The CLI reports unauthenticated, so actual cloud bucket creation, CORS application and image upload/readback await Cloudflare account access and genuine bucket-scoped credentials. No storage mutation, database migration, deployment, staging or commit. [Setup, credential fields and evidence](docs/development/r2-storage-setup.md).

## XR entry correction — screenshot follow-up

The reported white screen was the older `/xr/preview` placeholder sample. Fixed generic spatial links to open `/xr/hud`; added a prominent current-workspace switch and explicit legacy label on that sample. Unconfigured HUD includes the existing local 3D object demo link. Authorized project XR behavior is preserved. Fresh workspace verification passed14tasks,733tests/81files,bothbuilds;19 focused production browser cases passed, including two failing-then-passing entry regressions. No private campaign media is implied before services/assets are configured, and no commit or deployment occurred. [Exact changes/evidence](docs/development/spatial-hud-status.md).

## Spatial XR HUD shell and dashboard — 13 November 2026

Implemented the latest prompt's final execution scope: `/xr/hud` and the Spatial Studio entry link, shared dark/lavender HUD, actual A-Frame mouse/controller-ray surfaces, accessible navigation/dock, constrained nonprivate view preferences, environment presets and a connected dashboard through the existing strict workspace overview/session hook. Projects, metrics, tasks and activity use authorized domain data; missing services show setup/unknown states. Navigation retains the renderer and selection. Full authoring and voice stay in their established tools through explicit handoffs; deeper immersive workflows remain later phases. R3F, native, canonical v1 and database architecture are unchanged.

Verification: `pnpm check` PASS14tasks,733tests/81files,bothproductionbuilds; seven HUD unit cases;171 distinct Chromium cases passed across a170-pass full run and24-case targeted rerun. One production test initially failed because the temporary3180 server used a spatial bundle compiled for the normal3000 origin; an origin-matched spatial rebuild resolved it without product-code changes. Independent review's two reachability/permission findings were reproduced, fixed and re-reviewed. Desktop/mobile screenshots, measured software-renderer diagnostics, native artifact drift and whitespace checks passed. Real services and physical XR remain unverified. No native UI source changes, new simulator/device run, migration, staging, commit, push or deployment. Existing dirty work is preserved.

Open the running preview at `http://127.0.0.1:3180/xr/hud`. Exact files, components, connected features, tests, limitations and recommended conventional commits: [spatial HUD delivery report](docs/development/spatial-hud-status.md). Plan/audit: [implementation plan](docs/superpowers/plans/2026-11-13-spatial-xr-hud.md).

## Shotstack Video Creation integration — 13 November 2026

Implemented `/create/video` with the actual embedded SDK, authorized private image/video sources, bounded timeline/overlays, revisioned actor-private drafts, explicit render confirmation, durable single-dispatch attempts and verified private MP4 asset import. Source IDs, credentials and immutable outputs preserve existing boundaries. Additive migration0011 adds two functional tables; TS/OpenAPI/Swift/native artifacts are synchronized. No live migration, provider render, cloud write, staging, commit or deployment occurred. Configuration and real-provider acceptance remain open. Verification PASS: `pnpm check` completed all 14 tasks, 838 tests/95 files and both production builds; four distinct actual SDK browser flows and the production video entry/responsive check passed. Swift passed 48 bidirectional fixtures/nine invalid payloads; native core passed 48 tests and the unsigned generic visionOS Simulator project build succeeded. Independent review fixes have regressions. Exact files, limitations and setup are in the [Shotstack delivery report](docs/development/shotstack-video-status.md).

## Creator workspace master prompt — 13 November 2026

Implemented distinct shared-shell screens for Dashboard, Projects/detail tabs, persistent Brainstorm, Creation, Review, Assets, Clients, Analytics, Spatial entry, Camera Recording, Settings and Profile. Exact `/workspace` is now the web dashboard; `/workspace/UUID` and `/workspace/demo` preserve R3F. Old portal aliases redirect. Dark/lavender tokens, mobile drawer, private session cleanup, strict workspace APIs and additive migration 0010 are integrated. Brainstorm reuses Gemini and Sarvam; creation commands use reviewed allowlisted proposals and existing private draft/review flows. One shared microphone owner coordinates capture paths. Native generated contracts/tokens are synchronized; scene v1 and renderer ownership remain unchanged.

**Service state:** user confirms Clerk, Neon and R2 still need setup; Gemini and Sarvam also remain unconfigured. Distinct layouts and local tools remain accessible, with explicit contextual notices and unsaved drafts. Private persistence, actual provider requests and physical-device behavior are not live-verified. Migration 0010 is present as a reviewable SQL file but was not applied to a live database. No staging, commit, push, external provisioning or deployment occurred; earlier dirty work is preserved.

Verification and per-phase files/features/limitations/recommended commits are recorded in [the creator platform report](docs/development/creator-platform-status.md). Final verification PASS: `pnpm check` ran all 14 tasks, 726 tests/80 files and both production builds; the complete Chromium suite passed all 166 cases (4.8m), including desktop/tablet/mobile route checks. Swift passed 40 bidirectional contract fixtures/nine invalid payloads, native core passed 48 tests and unsigned generic visionOS Simulator project compilation succeeded. Independent review findings have regressions; whitespace checks pass and the index remains empty. Compilation and synthetic/provider-fixture tests are not live service/device acceptance.

## Navigation recovery and outstanding service setup

Corrected actual user-visible failures: the internal spatial server now redirects known portal page GET/HEAD requests to the configured portal, Review is enabled in the studio header, and Brainstorm opens a project chooser for the saved-brief flow. The chooser offers only editable projects and its project fragment exists before asynchronous brief data loads. README now identifies the correct editor, upload workflow and migrations through0009. Local origin/template use127.0.0.1 to avoid the unrelated IPv6 Docker service.

PASS: final `pnpm check`646 tests/68 files,14tasks/bothbuilds;26 focused unit/SQL cases; full121 Chromium cases before review corrections and15 final navigation/brief cases afterward (122 distinct cases). Reviewer issues have red→green regressions; whitespace/index checks pass. No shared API/native/schema changes, staging, commit, migration or deployment.

**Private workflows are not operational yet.** User confirms Clerk/Neon/R2 still need setup. Current project API returns503/PROVIDER_UNCONFIGURED; required keys/database/storage values and AI/voice settings are absent. Features01–08 describe source/fixture work, not configured live delivery. [Actual page locations, fixes, setup sequence and evidence](docs/development/workflow-navigation-status.md).

## Feature 08 — reviewed revisions and resubmission

Implemented a strict parent/version/latest-decision binding on the existing immutable publication flow. Resubmission requires editor permission and a different verified uploaded image/hash, serializes competing successors, preserves exact retries after later versions, and keeps v1 bytes/feedback unchanged. New versions need an explicit review grant; approval never carries forward. Creator history/dialog now support resubmission and per-version context/status; clients see only currently granted same-project version history, with pending and old decisions kept separate. No new table, migration, dependency or native UI; generated API/Swift additions are synchronized.

Local verification PASS: final `pnpm check` (14 tasks, 642 tests/67 files and both builds), 63 focused SQL/unit cases, all 118 Chromium cases/16 files, 31 Swift round trips/nine invalid payloads, 48 native core tests and unsigned generic visionOS Simulator project compilation. Independent review's revoked-history window has a failing-then-passing regression; desktop/mobile inspection and whitespace checks passed. Full browser evidence and exact paths/APIs/security/manual demo are in the [delivery report](docs/development/revisions-status.md).

**Live acceptance NOT RUN:** actual v1 change request→new upload→v2 publication/explicit share→client pending/review needs configured Clerk/Neon/private R2, real accounts and separately authorized existing migrations through 0009. Local SQL/provider/browser fixtures are not live acceptance. No staging, commit, push, deployment, live migration or external account/provider mutation occurred; earlier dirty work is preserved. Suggested commit: `feat(delivery): support reviewed revisions and resubmission`.

## Feature 07 — authenticated version-scoped client review

Implemented creator-authorized sharing with one verified existing Clerk subject per published version, expiring/revocable identity-bound grants, a private reviewer inbox/page/image and immutable version-bound comments/terminal decisions. Review grants create no project membership. Creator feedback survives refresh, including revoke controls for older displayed versions. Media authorization repeats after storage latency and at byte delivery. Strict shared API contracts and generated Swift artifacts are synchronized; migration `0009_client_review.sql` adds grant bindings/constraints and append-only comment protection to existing tables.

Local verification PASS: final `pnpm check` (14 tasks, 631 tests/66 files and both production builds), 55 focused SQL/unit cases, all 115 Chromium cases/16 files, 28 Swift round trips/nine invalid payloads, 48 native core tests and unsigned generic visionOS Simulator project compilation. Independent review findings have red-to-green regressions; desktop/mobile inspection and whitespace checks passed. Exact files/APIs/migration/security/test evidence and manual demo are recorded in the [delivery report](docs/development/client-review-status.md).

**Live acceptance NOT RUN:** real creator/client publish→review→approval and third-account API/media denial need configured Clerk/Neon/private R2, existing accounts, a verified publication and separately authorized migration through 0009. Local SQL/HTTP/provider fixtures are not live acceptance. No email/token invitation flow or native review UI was added. No staging, commit, push, deployment, live migration or external account/provider mutation occurred; earlier dirty work remains preserved. Suggested commit: `feat(review): add scoped client review and approval`.

## Feature 06 — immutable uploaded-image deliverable publication

Implemented explicit editor-only publication of verified ready uploaded images into existing immutable content versions. Added separate v2 provenance (unchanged legacy v1), actual private-byte/hash verification, atomic version allocation, UUID-keyed retries, optional real brief/context-only scene links, safe collection/detail projections and creator dialog/history. Publishing never claims a canonical render, grants reviewer access or creates approval. Existing ready assets/decisions remain immutable. No table, migration or dependency; additive generated API/Swift artifacts are synchronized.

Verification PASS: final `pnpm check` (14 tasks, 613 tests/63 files and both builds), 72 focused contract/SQL cases, all 108 Chromium cases/15 files, 25 Swift round trips/nine invalid payloads, 48 native core tests and unsigned generic visionOS Simulator project compilation. Independent review found two races (scene context locking and upload-driven selection change); both have passing regressions. Desktop/mobile inspection and `git diff --check` passed. Exact paths/API/security/evidence/manual demo/staging guidance are in the [delivery report](docs/development/deliverable-publication-status.md).

**Live acceptance NOT RUN:** Clerk/database/private R2 configuration, creator accounts and real verified uploaded source are absent. Fixture checks are not live service/device acceptance. No storage write, live migration, provider call, deployment, staging, commit or push occurred; earlier uncommitted Features 00–05 remain preserved. Suggested commit: `feat(delivery): publish immutable image deliverable versions`.

## Feature 05 — secure private project image ingestion

Connected the existing bounded private R2 staging/verification/promotion flow to an independent project upload and ready-image gallery. Added explicit stage progress/cancellation, same-file idempotent retry, authorized bounded thumbnails, refresh/local selection, and session/role/preview cleanup. Existing Creative Studio uploads no longer require Gemini; project images appear through the canonical editor's existing Refresh assets. Missing stages now produce an actionable conflict, and checksummed previews verify actual stored bytes. Existing immutable writes, SQL authorization, quotas and orphan cleanup are reused; no migration, dependency, contract or native change.

Local verification PASS: final `pnpm check` (14 tasks, 597 tests/61 files, both builds), 83 focused unit/SQL cases, all 102 Chromium cases/14 files, independent scoped review, desktop/mobile inspection and `git diff --check`. An explicit opt-in live smoke is available; its no-args refusal passed without network calls. Full evidence and the exact paths/API/security/cleanup/demo/staging instructions are in the [delivery report](docs/development/r2-image-ingestion-status.md).

**Live acceptance NOT RUN:** Clerk, database and private R2 configuration/accounts are absent. No real cloud upload, CORS/policy change, cloud cleanup, live migration, deployment, staging, commit or push occurred; earlier uncommitted Features 00–04 remain intact. The live script creates an asset only with explicit `--live` and disposable-project configuration. Suggested commit: `feat(assets): ingest validated private project images`.

## Feature 04 — canonical R3F editing and persistence

Implemented the scoped [spatial editor hardening](context/feature-specs/04-spatial-editor.md): authorized ready-asset library refresh, existing Creative Studio navigation, numeric control hints, strict local command dispatch through existing undoable state, invalid-numeric Save protection, visible WebGL fallback and dirty-navigation protection. Added a separate `/workspace/demo` procedural cube with no project/asset identity, API or persistence. Existing quaternion v1, explicit revision CAS Save, web-only backend, R3F/A-Frame/recording separation and native contracts remain intact; no dependency or migration was added.

Local verification PASS: final `pnpm check` (14 tasks, 587 tests/60 files and both production builds), focused spatial SQL/unit checks (29/eight files), all 92 Chromium cases in 13 files including 18 spatial cases, GPU disposal/remount checks, independent review, desktop/mobile screenshot inspection and `git diff --check`. Exact files, API/security examples, evidence, prerequisites, manual demo and staging guidance are in the [delivery report](docs/development/spatial-editor-status.md).

**Live acceptance NOT RUN:** Clerk/database/R2 credentials and a real creator-owned ready asset are absent. No fabricated ready rows or private assets were created. Use the existing secure upload/finalize workflow in a disposable project once configured; the procedural demo does not satisfy persisted-asset acceptance. Prior uncommitted work is preserved. No staging, commit, push, live migration, cloud write or deployment occurred. Suggested commit: `fix(spatial): harden canonical scene editing and persistence`.

## Feature 03 — Sarvam speech and reviewed legacy actions

Implemented the [Feature 03](context/feature-specs/03-sarvam-voice.md) legacy-first slice: explicit record/stop, visible transcript, Gemini proposal, review and fresh authorized Apply for A-Frame actions. Added exclusive capture ownership, cancellation/late-result protection, Clerk session/context cleanup, silence/permission/provider fallback and reset/readiness race fixes. Focus is view-only; layout changes still use explicit CAS Save. No new API, migration, dependency, raw audio persistence or native change.

Verification PASS: `pnpm check` (14 tasks, 582 tests/58 files, both production builds), all 84 Chromium cases/13 files, native artifact drift, independent re-review, desktop/mobile inspection and `git diff --check`. Browser audio is synthetic and provider/session boundaries are fixtures. Full commands, changed paths, API examples, manual QA and staging guidance are in the [voice delivery report](docs/development/sarvam-voice-status.md).

**Live acceptance NOT RUN:** Sarvam/Gemini keys/models, Clerk/database setup and accounts are absent. **Canonical R3F voice NOT IMPLEMENTED:** the verified-live legacy prerequisite remains open; manual canonical editing is preserved. Existing uncommitted Features 00–02 remain intact. No commit, push, live migration, provider request or deployment occurred. Suggested commit: `feat(voice): connect reviewed speech proposals to supported actions`.

## Feature 02 — brief-aware Gemini creative assistant

Implemented the requested [brainstorming feature](context/feature-specs/02-gemini-brainstorming.md): authorized saved-brief context, bounded server-side Gemini requests, three validated directions or labelled plain text, atomic actor/project quotas, one opt-in transient retry and post-latency access/version checks. The project panel supports quick prompts, error recovery, copy and explicit addition to unsaved brief notes. It never executes scene commands or publishes generated assets. No migration, dependency or voice UI was added.

Verification PASS: `pnpm check` (14 tasks, 577 tests/58 files and both builds), all 71 Chromium cases/12 files, 22 Swift round trips/nine invalid payloads, 48 native core tests and unsigned generic visionOS Simulator project compilation. Independent review and desktop/mobile checks completed; `git diff --check` passed. The [delivery report](docs/development/gemini-brainstorming-status.md) lists exact paths, API examples, command evidence, manual QA and staging guidance.

**Live acceptance NOT RUN:** Gemini key/model, Clerk/database configuration and development accounts are absent. The opt-in live smoke is available but was not invoked. Prior Feature 00/01 work is preserved. No commit, push, live migration, provider request or deployment occurred. Suggested commit: `feat(ai): connect Gemini brainstorming to project briefs`.

## Feature 01 — authorized versioned project briefs

Implemented the requested [brief feature](context/feature-specs/01-project-briefs.md) using the existing rich payload, version rows and project permissions: structured project-page authoring, authorized GET/PUT, atomic expected-version writes, idempotent retries, draft-preserving conflict/network recovery and approved-only client summaries. Generated shared API artifacts are synchronized; no migration or dependency was added. Concurrent Feature 00 work below is preserved.

`pnpm check` passed all 14 tasks, 551 tests in 56 files and both production builds; focused brief checks passed 25 tests and all 11 brief Chromium fixtures passed, alongside 23 existing shell/recording/XR/spatial cases. Swift contract checks passed 19 round trips/nine invalid cases and all 48 native core tests passed. Broader browser results and exact changed files are recorded in the [feature delivery report](docs/development/project-briefs-status.md).

Live creator/client sign-in and persisted demo acceptance remain **NOT RUN** without Clerk/database configuration and development accounts. The checked-in Xcode project **compiled successfully** for the generic visionOS Simulator with signing disabled after recovery from an initial disk-space failure; this does not claim app interaction or device verification. No commit, push, live migration, provider request or deployment occurred. Suggested commit: `feat(briefs): add authorized project brief authoring`.

## Current scope — Feature 00 repository baseline and demo safety

The requested [Feature 00 specification](context/feature-specs/00-repository-baseline.md) is the only implementation scope here. The [implementation map](docs/superpowers/plans/2026-11-13-repository-baseline.md), [demo status](docs/DEMO_STATUS.md) and [current runbook](docs/DEMO_RUNBOOK.md) distinguish source fixes, fixture verification and live acceptance.

- **Implemented:** legacy assistant confirmation now explicitly says reset **saves** the default and replaces saved/unsaved arrangements. Cancellation sends no reset POST; confirmed reset persists and survives reload in the actual client fixture.
- **Implemented:** legacy project list/detail/create/update use the existing safe project summary. Internal creator/workspace IDs remain in the database; public fields, response envelopes, authorization, validation, budgets and status codes are preserved.
- **Verified before changes:** Node v24.22.0/pnpm 11.12.0, lint/types, all 14 `pnpm check` tasks, 523 tests/54 files and both builds. Focused post-change SQL checks pass 100 cases across four suites; direct production builds of both apps pass.
- **Verification history:** the projection regressions and misleading reset-copy test failed before their fixes. Five older mutation assertions expected internal response fields; they now verify those ownership invariants through SQL. An intermediate full `pnpm check` failed one concurrently added project-brief test (536 tests passed); that next-feature work is preserved and outside this baseline. The final run passed all 14 tasks, 551 tests/56 files and both builds. All 27 distinct scoped browser cases passed across the run/rerun; one needed isolated Playwright artifacts after a shared trace file disappeared during concurrent testing. `git diff --check` and preservation hashes pass. Exact commands/failure history are in the demo status.
- **Real local environment:** portal/backend on `http://127.0.0.1:3000`, internal spatial app on 3001; use the portal's `/workspace` gateway. Port 3001's root is not the web portal. Manual navigation reaches the R3F entry and the honest project-setup gate. Real private APIs return sanitized no-store 503 responses while configuration is absent.
- **NOT RUN / blocked:** real Clerk creator sign-in, live project creation/reopen, and a ready private asset's canonical scene save/reload/conflict. Minimum prerequisites are local `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`, R2 account/access/secret/bucket configuration, the exact trusted public origin, development accounts and an authorized ready asset. SQL/HTTP fixtures are not live identity/storage acceptance.
- **Preserved:** original `.gitignore` changes and 15 design-output files, plus brief-feature files that appeared concurrently. No migration/dependency/renderer/native implementation was added for Feature 00. No files were staged or committed, and no push, live migration, provider call or deployment occurred. Suggested checkpoint only: `chore(repo): establish verified hackathon baseline`, using the exact paths in the demo status.

The code fixes are implemented; **the live persisted-demo acceptance gate remains blocked**. Stop at Feature 00. The prior connected studio milestone is documented separately in [its delivery status](docs/development/creative-foundation-status.md); native/XR reference redesign is not part of this baseline.

## Native simulator window recovery — 12 November 2026

Fixed repeated product opening creating empty duplicate windows. The workspace, product volume and inspector now use unique windows; launch presents the workspace, and both auxiliary windows include **Open Workspace**. Volume renderer ownership is acquired/released with appearance/disappearance, and **Close volume** returns to the workspace.

Verification: six simulator UI tests and three hosted RealityKit tests completed with zero unexpected failures. One reopened-model accessibility assertion remains a strict expected failure: display capture confirms the model renders, but its automation accessibility entry is missing after reopening. All 48 Swift core tests and native artifact drift checks passed. Physical-device and live-service acceptance remain open. See [native validation](docs/shape-studio/native-validation.md) for evidence and limitations.

## Historical scope: unified platform audit and monorepo foundation

The [unified prompt](docs/product/UNIFIED_PLATFORM_SPEC.md) governs the latest increment. Audit and phased implementation plan were committed first (`2e5f2b1`). Phase 1 introduces actual pnpm packages for scene schemas and shared configuration, a pinned Turbo check graph, safe environment diagnostics, independent path-aware native CI and architecture/platform/development documentation. The root Next app, A-Frame workspace and native app are preserved. See [active phases](context/progress-tracker.md) and [system overview](docs/architecture/system-overview.md). Phase 1 is locally verified: 425 unit/PostgreSQL tests, 32 production Chromium cases, 48 Swift core tests, Swift contract fixtures and the full lint/type/build graph passed. See [files, decisions and verification](docs/development/phase-1-status.md). R3F, organizations, realtime and the complete integrated MVP remain later milestones. Implementation commits: `8795545` (workspace/contracts) and `84389cb` (CI). Work is local on `feat/unified-monorepo-foundation`; no remote push or deployment.

## Preserved scope: Shape Studio Spatial native foundation

The [native master specification](docs/shape-studio/SPATIAL_MASTER_SPEC.md) extends the existing web foundation. A native SwiftUI/RealityKit app now shares authorized projects, assets, private drafts and canonical scenes with the backend. The increment includes bounded USDZ viewing/manipulation and an explicit immersive study. Validation: 394 web/API tests, 48 Swift core tests, 32 production-browser cases, six native simulator tests, and simulator/unsigned device-target compilation. See [native execution evidence and open acceptance](docs/shape-studio/native-validation.md) and [setup](apps/visionos/README.md). Live authentication/storage, generation orchestration, conversion, full collaboration and physical-device acceptance remain open.

## Preserved scope: Shape Studio foundation and initial web playground

The new cross-platform brief supersedes the prior browser-only scope. Follow the [seven-part audit/plan](docs/shape-studio/phase-0-plan.md) and [active phase tracker](context/progress-tracker.md). Phase 1 and initial Phase 2 are implemented and locally verified: 349 unit/PostgreSQL tests, 32 browser cases across the full run and targeted rerun, Swift contract checks, lint/types/formatting and production build pass. Later generation, collaboration and native app phases remain planned. See [delivery evidence and limits](docs/shape-studio/implementation-status.md).

## Preserved prior scope: functional browser XR studio

The latest [master specification](docs/XR_BROWSER_STUDIO_SPEC.md) supersedes the earlier Phase 1 boundary. Work follows the [repository audit and plan](docs/superpowers/plans/2026-11-12-functional-xr-studio.md). Historical [M0](docs/M0_IMPLEMENTATION_STATUS.md) and [Phase 1](docs/XR_PHASE1_IMPLEMENTATION_STATUS.md) evidence is preserved.

| Milestone | Implementation and evidence |
| --- | --- |
| 1. Foundation | Authenticated studio routes, client-only A-Frame and reusable capability detection implemented; real desktop rendering verified |
| 2. Spatial workspace | Selection, move/rotate/scale, focus/reset and accessible companion controls implemented; browser editing verified |
| 3. Immersive VR | Explicit session lifecycle, controller transform controls and recenter implemented; simulated rejection/cleanup verified; physical headset acceptance open |
| 4. Project integration | Authorized content/assets, versioned layouts/reset and migration implemented; PostgreSQL tests and browser save/reload fixtures verified; live accounts/storage unverified |
| 5. AI integration | Gemini/Sarvam adapters, restricted command proposals, microphone consent, STT/TTS and labeled local text mock implemented; live providers unverified |
| 6. Polish and validation | Resource bounds, recovery, strict XR CSP and documentation implemented; locally verified with 306 unit/PostgreSQL tests and 24 production-browser checks; live services/hardware remain unverified |

## Verification checklist

- [x] Preserve original project management and portrait recorder.
- [x] Authorize every private project, layout, assistant and asset operation.
- [x] Keep local edits after failed saves/conflicts and confirm reset/discard.
- [x] Recheck asset access after storage loading; reject remote model dependencies and excessive decoded resources.
- [x] Pass frozen/offline install, peer check and 20-table schema consistency check.
- [x] Pass 306 unit/PostgreSQL tests across 22 files.
- [x] Pass all 24 production-browser checks, including full-screen desktop/mobile, actual image/video/GLB/glTF previews, save/reload, conflicts, roles, PNG export and original recording regressions.
- [x] Complete final formatting/lint/types, production build and screenshot/decoded-media inspection.
- [x] Complete independent review, resolve identified issues and commit validated implementation locally.
- [ ] Verify configured Clerk/Neon/R2/Gemini/Sarvam accounts.
- [ ] Verify physical headsets and target browsers on HTTPS.

## Repository history

- Initial M0 commit: `a1b8dc02b01244623916fa3c5493955eb762afce`, already pushed to `origin/main` in the earlier handoff.
- Previous foundation: `b5652f1`, local branch `feat/xr-foundation`.
- Functional commits: `2d75490` persistence/assets, `72620dc` assistant/voice, `960d9b8` combined studio/UI/tests. These commits remain local.

Detailed evidence and open acceptance: [implementation status](docs/IMPLEMENTATION_STATUS.md). Setup and hardware procedures: [XR documentation](docs/xr/architecture.md).

## Reference-led dashboard and creative canvas

The supplied dashboard/editor references are implemented as a shared BoloVerse glass/lavender shell, authorized dashboard and local image canvas. Existing XR and recording flows remain available. New image edits export real PNG pixels locally without changing source assets; image generation is explicitly unconfigured. No database/API changes were needed for this UI extension. Validation: lint/types/build pass, 302 unit/integration tests pass, and all 24 production browser tests pass. Live providers and physical hardware remain unverified. See [delivery details](docs/superpowers/specs/2026-11-12-reference-studio-status.md).

Native local commits: `f2c1346` audit/plan, `5785d55` verified native API/scene/USDZ support, and `3403e42` native workspace/RealityKit/tests. No remote push or deployment was performed.
