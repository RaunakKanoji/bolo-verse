# Three application restructure implementation plan

> **For agentic workers:** Use executing-plans with independent delegated tasks and a final independent review. Track the checklist and evidence in this document.

**Goal:** Establish real Next.js web/backend and browser spatial applications alongside the existing independent visionOS application, with canonical desktop scene editing.

**Architecture:** The web app moves from root into `apps/web` and remains the public same-origin gateway and sole backend authority. A separate Next shell in `apps/spatial-web` serves `/workspace` and `/workspace/[projectId]` with a browser-only R3F renderer. Existing A-Frame and recording routes remain owned by web and isolated. Native sources and strict v1 contracts remain unchanged.

**Tech stack:** Existing pinned Next/React, pnpm/Turbo, TypeScript, Clerk/Neon/Drizzle/private R2, React Three Fiber/Three.js, existing SwiftUI/RealityKit.

**Spec:** The detailed restructuring prompt accepted in this conversation, together with `docs/product/UNIFIED_PLATFORM_SPEC.md` and existing ADRs; this milestone supersedes ADR 0001's temporary root-app location only.

## Global constraints

- Keep all existing native/unrelated working-tree changes untouched; work in the existing feature checkout to keep them visible and avoid duplicating concurrent native work.
- No auth bypass, duplicate backend, new scene wire format, database migration or public private-asset URL.
- Preserve canonical v1, revision CAS, isolated AFRAME.THREE, mono recording and teardown.
- Keep native independent of pnpm; artifacts remain checked in and drift checked.
- Later organizations, uploads/conversion, realtime and unified voice remain separate slices.

## Route ownership

| Public path | Owner | Behavior |
| --- | --- | --- |
| `/`, `/app/*`, `/studio/*` | web | Existing routes and permissions retained |
| `/xr/*`, `/studio/xr/*` | web | Existing isolated A-Frame, aliases and public preview retained |
| `/api/*`, `/api/v1/*` | web | Existing authoritative endpoints unchanged |
| `/_next/*`, `/vendor/*`, existing public assets | web | Existing asset behavior |
| `/workspace`, `/workspace/:projectId` | spatial-web through web rewrite | New spatial landing and authorized canonical editor |
| `/spatial-static/*` | spatial-web through web rewrite | Collision-free Next static asset prefix |

The web gateway rewrites only workspace/spatial-static paths to a configured server-only spatial origin. Browser API/asset fetches remain relative to the public origin. Spatial SSR forwards only session transport to a fixed configured backend origin, never a user-selected destination; the backend independently verifies identity and project access. No caching of private bootstrap data. Cross-zone links use full navigation.

## Review focus

1. Rewritten private requests retain authentication/Origin checks and never expose server credentials.
2. Conflicts, late responses and permission loss retain edits without applying private results to another project/session.
3. Asset loading is bounded and unsupported references remain preserved rather than silently removed.
4. Root-relative tooling and CI contract classification continue to work after relocation.
5. Existing XR, image export and mono recording work through production routing.

## Task 1: Web extraction and orchestration

**Files:** Move root `src/`, `public/`, Next/PostCSS config into `apps/web`; update root scripts, TS/Vitest/Playwright/ESLint, Drizzle and scripts/CI paths, Turbo and workspace membership. Create web package manifest and gateway rewrites.

**Interfaces:** Web keeps existing `/api/*`, XR and recorder URLs. Spatial consumes `/api/v1/*` and `/workspace` rewrites. Root `pnpm dev/start` starts both apps; `pnpm check` validates all JavaScript applications/packages.

- [x] Record baseline tests and dirty-file list.
- [x] Update CI classification behavioral test for moved contract paths; observe failure, then update classifier.
- [x] Move web source/assets/config; fix imports and tooling using module-relative repository paths.
- [x] Wire same-origin gateway and lifecycle-aware dual-app dev/start launcher.
- [x] Verify existing tests, generated artifacts, lint/types and production build.

## Task 2: Canonical spatial editor

**Files:** New `apps/spatial-web` manifest/config/source, behavioral unit tests in its source test folder, and browser fixture/harness integration coordinated with Task 3.

**Interfaces:** Consume current generated client/models from language-neutral api-contract and pure @shape/scene-schema. No web/server imports. Use fixed `WEB_INTERNAL_ORIGIN` for no-store server bootstrap; same-origin browser fetches. Public `/workspace` landing; private `/workspace/[projectId]` loads authorized project/assets/scene or a safe access notice.

- [x] Write failing scene-state behavioral tests covering edit/undo/redo, schema bounds, save snapshots and conflict retention.
- [x] Implement scoped editor state and validated same-origin API transport.
- [x] Implement a browser-only R3F canvas with supported asset loading, pointer selection/transform and accessible numeric controls, stable IDs, dirty/save/conflict feedback and resource cleanup.
- [x] Keep unsupported formats/objects visible as limitations and preserve their canonical data.
- [x] Verify focused tests, lint/types and production build.

## Task 3: End-to-end integration and documentation

**Files:** Tests/e2e and browser fixtures/harness, web project/navigation links, architecture/ADR/platform/development/context documentation.

- [x] Add browser flows for the real gateway/landing/private denial and fixture-only authorized editor save/reload/conflict/read-only/cleanup behavior, without production auth bypass.
- [x] Add cross-application navigation to the web/project interface.
- [x] Update ADR 0001 and add the new decision, ownership/dependency graph, setup/deployment/rollback docs and honest progress.
- [x] Run `pnpm check`, full production Chromium regressions and native contract/copy checks; compile native only if native sources/artifacts are changed by this milestone.
- [x] Obtain independent code/security review, address material findings and repeat affected checks.
- [x] Record fresh verification and remaining live/device gates; do not push or deploy.

## Evidence and decisions

- Initial dirty files are native/document work; this implementation must not modify them.
- Execution authorized by the user's request to implement the supplied prompt; no new approval gate is necessary for local reversible changes.
- Parallel work is limited to disjoint application source and audit/testing responsibilities; dependency installation and root graph mutations remain serialized.

## Completion evidence

- Work stayed in the existing feature checkout; unrelated native work was preserved. All 135 tracked source/public relocation targets exist.
- CI classifier regression: relocated contract path first failed native selection, then all 24 classifier cases passed after the prefix update.
- Runtime gateway tests: three path/origin checks pass. Request-time Proxy replaces build-baked rewrite targets so custom production ports work.
- Initial editor verification: 12 unit tests plus six real WebGL fixture cases. Independent review then identified session renewal and identity-boundary gaps; a scoped follow-up added the publishable-only provider, fresh-token transport and session-keyed authorization/cancellation.
- Final verification: `pnpm check` 14 tasks successful, 444 tests/42 files, both production builds; 42/42 production Chromium flows; 48/48 native core tests; Swift 11 round-trip/9 invalid contract fixtures. Frozen offline installation, final lint/types and whitespace checks passed.
- Native source, OpenAPI and generated API/token artifacts remain unchanged. No DB migrations, credentials, live provider calls, remote push/deployment or new simulator/device run.
- Remaining live recovery/device/hosting gates are recorded in `docs/development/three-application-status.md`.
