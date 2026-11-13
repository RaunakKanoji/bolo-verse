# Spatial XR HUD implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Implement the supplied prompt's final execution scope: shared spatial HUD shell and first functional dashboard.
**Spec:** `docs/product/SPATIAL_XR_HUD_SPEC.md` (final execution instructions govern this increment).
**Architecture:** Extend the existing isolated A-Frame StudioAdapter. React owns domain state and accessible desktop controls; bounded individual canvas-backed surfaces provide ray-selectable immersive controls. Keep R3F and native independent. Reuse the existing workspace session/data hook and strict overview DTO, without adding a database or auth path.
**Tech stack:** Existing Next App Router, React, TypeScript, Zod, A-Frame and AFRAME.THREE. No dependencies.

## Architecture audit, before implementation

- Existing routes: `/xr/preview` public legacy sample, `/studio/xr/[projectId]` authorized legacy project runtime, `/workspace/[projectId]` canonical R3F editor. `/spatial-studio` is the creator shell entry.
- `xr/runtime/studio-adapter.ts` owns A-Frame, a disposable same-origin iframe, render loop, VR sessions, mouse cursor/controller rays, focus, assets and teardown. Extend this owner rather than start a second renderer. The HUD gets an additive `/xr/hud` route and entry link; existing routes retain behavior.
- `features/platform/WorkspaceSession.tsx` keys subtrees to Clerk sessions. `use-workspace-data.ts` aborts stale requests, checks session/path and clears denied data. `StudioOverviewSchema` and `/api/v1/workspace/overview` provide actual projects, metrics, tasks and activity. No synthetic campaign statistics.
- Existing projects/brainstorm/create/review/assets/clients/recording/settings are established web workflows. This increment switches spatial context and provides explicit handoffs; their complete immersive authoring surfaces are later phases. Existing project assistant already uses validated Gemini/Sarvam proposals and exclusive microphone ownership. Reuse only when an authorized editable project is selected; do not invent a new provider integration.
- Existing tokens already provide dark/lavender surfaces and system typography. Local HUD materials use the prompt's near-black/lavender palette, without changing global design tokens. Native remains independent; the supplied prompt requests browser XR, not a Swift redesign.

## Global constraints

- One renderer/loop owner, AFRAME.THREE constructors only; no arbitrary HTML or provider calls in rendering.
- Keep canonical scene v1 and legacy scene persistence untouched. Local layout preferences contain only bounded HUD positions/preset/environment, no private names/IDs/prompts/media.
- Only explicit user actions enter XR or leave for standard tools. Runtime capability detection; no assumed AR/hand support. DOM controls have real spatial counterparts for supported shell actions.
- Preserve unrelated dirty files. No staging, commits, push, migration or deployment in this increment; propose focused commits as requested after phases.

## Review focus

- Stale account/private data must disappear from both DOM and rendered textures, including after a request denial.
- Navigation must update surfaces without recreating A-Frame or starting a second render loop.
- Bad storage/unsupported WebGL/XR must leave readable desktop controls and recovery.
- Panel positions must stay finite, in front, readable and reset independently of project CAS saves.
- Controller actions must use the same allowlisted dispatcher and not double-dispatch or mutate domain data from arbitrary model output.

## Tasks

### 1. Shell model and constrained preferences
- [x] Add failing unit tests for allowlisted navigation/actions, bounded position validation, corrupt persisted layout, reset and privacy.
- [x] Implement `xr/hud/hud-state.ts`: workspace navigation metadata, strict schema, reducer and preference serialization.
- [x] Verify focused unit tests.
Suggested commit: `feat(xr): establish bounded spatial HUD state`.

### 2. A-Frame surface adapter
- [x] Add failing browser coverage for real runtime, navigation without remount, ray action and cleanup.
- [x] Add reusable `hud-surfaces.ts` using AFRAME.THREE, finite surfaces and event-driven texture updates. Extend StudioAdapter additively with HUD callbacks, update API and room presets. Reuse existing session lifecycle/rays.
- [x] Verify types/lint and browser cases; retain old XR tests.
Suggested commit: `feat(xr-ui): add ray-selectable HUD surfaces and layout presets`.

### 3. Connected dashboard and desktop shell
- [x] Add `SpatialHUDShell`, view model and CSS; `/xr/hud`; link from Spatial Studio entry. Reuse WorkspaceSession/useWorkspaceData overview. Show loading/empty/errors/retry and project selection/details. Accessible navigation/dock, layout reset, bounded panel movement, environments and reduced motion.
- [x] Reuse existing project assistant with honest unsupported/no-project state. Other workspaces show domain-relevant summaries and explicit standard-tool actions; full immersive authoring remains later work.
- [x] Test configured fixture loading, denied/session transitions, mobile/keyboard and real production route.
Suggested commit: `feat(xr-workspace): connect spatial dashboard to workspace services`.

### 4. Verification and report
- [x] Run `pnpm check`, native artifact drift (part of graph), production browser HUD + preserved XR/recording/navigation flows; inspect desktop/mobile rendering and measured renderer statistics.
- [x] Fresh independent scoped review; fix material findings with regressions.
- [x] Update both trackers and `docs/development/spatial-hud-status.md` with files/components/features/commands/results/limitations/recommended commits. Hardware and live-service checks remain pending without equipment/credentials.

## Completion evidence

`pnpm check`:14tasks,733tests/81files,bothbuilds. Seven HUD unit tests. All171 distinct Chromium cases passed across the full170-pass run and24-case origin-corrected rerun. Scoped independent review clean after two reproduced/fixed findings; desktop/mobile screenshots inspected. No staging/commit/deployment or live/hardware claim. See `docs/development/spatial-hud-status.md` for exact evidence and remaining gates.
