# Shape Studio progress tracker

Updated 2026-11-12 (Asia/Kolkata).

## Current scope: unified platform audit and monorepo foundation

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
