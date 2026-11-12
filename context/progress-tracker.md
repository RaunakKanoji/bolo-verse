# Shape Studio progress tracker

Updated 12 November 2026 (Asia/Kolkata). Current scope: Phase 0 audit and Phase 1 monorepo foundation from the [unified platform prompt](../docs/product/UNIFIED_PLATFORM_SPEC.md). See the [system overview](../docs/architecture/system-overview.md) and [committed plan](../docs/superpowers/plans/2026-11-12-unified-monorepo-foundation.md).

## Native simulator window recovery — 12 November 2026

Fixed repeated product opening creating empty duplicate windows. The workspace, product volume and inspector now use unique windows; launch presents the workspace, and both auxiliary windows include **Open Workspace**. Volume renderer ownership is acquired/released with appearance/disappearance, and **Close volume** returns to the workspace.

Verification: six simulator UI tests and three hosted RealityKit tests completed with zero unexpected failures. One reopened-model accessibility assertion remains a strict expected failure: display capture confirms the model renders, but its automation accessibility entry is missing after reopening. All 48 Swift core tests and native artifact drift checks passed. Physical-device and live-service acceptance remain open. See [native validation](../docs/shape-studio/native-validation.md) for evidence and limitations.

## Unified platform phases

| Phase | Status | Scope / next work |
| --- | --- | --- |
| 0 — Audit and architecture | Complete | Actual 22-table/domain/API inventory, target directory layout, dependency graph, strict v1 compatibility and phased plan committed before implementation. |
| 1 — Monorepo foundation | Complete; locally verified | Real scene/config packages, pnpm workspace, Turbo check graph, safe environment diagnostics, path-aware independent native CI and requested documentation. Existing shells retained. |
| 2 — Shared backend | Reuse established; extensions planned | Existing Clerk/project membership/SQL permissions and typed v1 contracts; organization/profile administration is not implemented. |
| 3 — Core web | Existing functionality retained | Projects, briefs, ready asset views and browser assistant exist; fuller domain workflows remain scoped increments. |
| 4 — Shared spatial foundation | Canonical v1 established | Current CAS persistence retained. Hierarchy/environment, multi-scene history, explicit v2 migration and common renderer interface are future work. |
| 5 — Browser spatial | A-Frame retained; R3F planned | No new R3F runtime or empty spatial application was added in Phase 1. |
| 6 — Voice and AI | Existing browser adapters retained | Shared cross-platform command/tool registry and native microphone workflows remain planned. |
| 7 — Native foundation | Existing tested increment retained | Native SwiftUI/RealityKit remains independent of pnpm; live registration/storage and physical-device acceptance remain open. |
| 8 — Collaboration and review | Planned | Presence/realtime and complete client deliverable workflows are not implemented by tooling changes. |
| 9 — Production hardening | External gates open | No remote CI execution, live services, deployment or physical-headset acceptance claimed. |

## Current Phase 1 verification

- `pnpm check`: 11 successful tasks, including lint/types/formatting, environment/drift checks, 425 unit/PostgreSQL tests in 36 files and the Next production build.
- All 32 Chromium regression cases passed against the production server; existing editing, XR and recording behavior is preserved.
- Swift contract verification passed (11 round-trip fixtures, 9 invalid payloads, request/route checks), along with 48 native core tests. No native rendering source changed or new simulator/device run was claimed.
- Frozen installation passed. Turbo package cache reuse and invalidation after shared compiler configuration changes were verified. Independent reviews found no remaining blocker.
- See [Phase 1 files, decisions and evidence](../docs/development/phase-1-status.md). Local branch: `feat/unified-monorepo-foundation`; no remote push or deployment.

## Preserved previous Shape Studio roadmap

| Phase | Status | Evidence / remaining scope |
| --- | --- | --- |
| 0 — Audit and plan | Complete | Existing 20-table app reviewed; seven requested planning sections committed before broad changes. |
| 1 — Shared foundation | Implemented | Strict v1 DTOs, safe project/asset routes, private draft CAS/quota, migration 0004 and immutable decisions; OpenAPI-generated TS/Swift; shared tokens and canonical quaternion adapters. Existing auth/storage/provider boundaries retained. |
| 2 — Initial creative studio | Implemented and locally verified | Four prompt modes, real local image edits/export, scoped state, explicit draft saves, responsive panels, light/dark shell and honest unavailable integration states. Functional generation is Phase 3. |
| 3 — Generation | Planned | Provider/job/private-storage/metadata orchestration, history and recovery not implemented. |
| 4 — Brainstorming | Planned | Existing spatial text/speech assistant retained; infinite node canvas and new AI workflows not implemented. |
| 5 — MSME collaboration | Planned | Existing review records retained and decision history protected; new client portal/approval/delivery workflows not implemented. |
| 6 — Native foundation | Implemented increment | Native Xcode app, hosted auth adapter, authorized projects/assets, private prompt drafts and native materials. Live registration/auth and AI conversation remain open. |
| 7 — Native spatial capabilities | Implemented increment | Bounded RealityKit viewer, local/project USDZ, targeted gestures, canonical scene CAS and explicit immersive study. Conversion and multi-object immersive production remain open. |
| 8 — Full platform acceptance | Open | Live accounts, deployed infrastructure, accessibility audit, measured device performance and physical headsets remain external checks. |

## Preserved native delivery verification

- 394 web/API/PostgreSQL tests and 48 Swift core tests pass.
- All 32 production Chromium cases pass; browser XR, recording and creative editing remain intact.
- Native simulator and unsigned physical-target builds pass with Xcode 26.0.1; physical-target compilation is not device testing.
- All six native simulator tests pass: three UI tests and three tests using real RealityKit USDZ decoding/manipulation/restore. Remaining gates are in [native validation](../docs/shape-studio/native-validation.md).
- Migration 0005 adds canonical project scenes, with atomic role/asset/revision checks. Separate USDZ delivery preserves browser limits. No live database changes were made.
- Native architecture, setup, risks and phase boundaries are documented; no live credential configuration or remote deployment occurred.

## Preserved web-foundation verification

- 349 unit/PostgreSQL tests passed across 29 files in the current implementation run.
- Generated OpenAPI/TypeScript/Swift and CSS/Swift token drift checks passed.
- Swift 6 typecheck, seven JSON round trips, six invalid payload cases, native request construction and route encoding passed. These are contract tests, not native UI/device validation.
- Drizzle reports 21 tables and no schema drift. Migration 0004 was exercised locally in PGlite; it was not applied to a live database.
- Formatting, ESLint, strict TypeScript and production build passed. Frozen offline lockfile validation passed.
- All 32 unique Chromium cases passed across the full run and targeted rerun. The first full run passed 30/31; its stale XR navigation selector was updated, then all 12 affected/new cases passed, including a new crop/rotation/sharpness export check.
- Desktop/mobile/dark screenshots and decoded image/recording output were inspected. The final desktop panel focus correction passed the affected browser flows.
- Independent backend and UI reviews completed; identified findings were resolved and rechecked.

## Boundaries

Public samples and local image editing require no provider credentials. An authenticated authorized project is required for saved prompt drafts. Draft saves do not save image pixels or invoke generation. Assets outside the bounded preview subset receive metadata with a null preview URL. Unsupported generation and publication actions remain disabled.

No live Clerk/Neon/R2/Gemini/Sarvam account calls or physical-device checks were performed. Native simulator evidence now appears in the separate validation document; hosted authentication remains unverified with live credentials. Existing browser XR/recorder behavior passed the combined regression run. See [root tracker](../progress-tracker.md) for preserved prior history.

Dirty prompt warnings cover reload/unload, same-window internal links and shell keyboard shortcuts. Browser history Back/Forward is not intercepted; explicitly save project prompts before using history navigation. Local image edits/variants are ephemeral and never part of a prompt save. Sharpness exports are bounded to 4 megapixels; other image operations retain existing file/pixel bounds.

Detailed delivered behavior, API boundaries and deployment notes: [implementation status](../docs/shape-studio/implementation-status.md). Local branch: `feat/shape-studio-foundation`; initial history remains intact.

Local implementation commits: `bd4088b` audit/plan, `a7f93af` shared contracts/database/tokens, `11e0815` web playground and verification. No remote push or deployment was performed in this phase.

Native work is on `feat/shape-spatial-native`; the prior web commits and initial repository history remain intact. See the native validation document for current evidence rather than treating historical test counts as the latest run.

Native local commits: `f2c1346` audit/plan, `5785d55` verified native API/scene/USDZ support, and `3403e42` native workspace/RealityKit/tests. No remote push or deployment was performed.
