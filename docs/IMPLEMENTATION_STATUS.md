# Functional XR studio implementation status

Updated 2026-11-12 (Asia/Kolkata). Scope: the latest [browser studio specification](XR_BROWSER_STUDIO_SPEC.md). Historical [Phase 1](XR_PHASE1_IMPLEMENTATION_STATUS.md) and [M0](M0_IMPLEMENTATION_STATUS.md) evidence remains separate. Implementation is locally verified; live accounts and physical-device acceptance remain open.

## Features and changed files

- **Routes/capabilities:** authenticated `/studio`, `/studio/xr`, `/studio/xr/[projectId]` and compatible `/xr/[projectId]`; new `src/xr/capabilities.ts`, hook, capability panel and error boundary. Optional VR/AR, graphics, pointer, touch, microphone availability and secure context are feature-detected. Detection never asks for microphone permission. AR entry stays disabled.
- **Workspace:** `XRWorkspaceClient`, `useWorkspaceState`, `TransformPanel`, transform reducer, serializers and scene adapter provide real selection, move/rotate/scale, focus/reset, save/reload, read-only access and recoverable errors. Authorized briefs, artifacts, ready assets and reviews map to spatial content; private projects never receive samples. Runtime updates preserve a single scene. Controller transforms use the same bounded reducer.
- **Assets:** new `xr-assets` repository/contracts, R2 reader and protected endpoint. Images/videos attach real textures; self-contained static GLB/glTF attaches geometry. PDFs remain document cards. Loading is lazy, cancellable and limited to three decoded assets. Access is checked before and after storage reads; object keys and credentials remain server-only.
- **AI/voice:** shared assistant contracts, server providers/services/routes and `src/xr/assistant/` UI. Gemini returns bounded, authorized command proposals; users explicitly apply them and confirm reset. Sarvam transcription/TTS use server-only keys and time/size limits. Disclosed microphone capture starts explicitly, stops after 20 seconds and cleans up on disposal. Command audio is not persisted. The local text mock is clearly labeled and never bypasses authentication.
- **Preservation/security:** existing Next/React/Clerk/Neon/Drizzle, project flows and mono recording lab remain. Strict CSP lives inside the A-Frame realm; parent headers do not globally relax scripts. Models use A-Frame's own engine. All persisted transforms and provider output are validated.
- **Documentation/tooling:** `.env.example`, README, tracker, decisions/integration inventory and seven `docs/xr/` guides updated. AWS S3 SDK 3.1165.0 and test-only esbuild 0.28.2 are pinned in the existing pnpm lockfile.
- **Combined visual work:** the user confirmed inclusion of the concurrent full-screen studio, dashboard and creative canvas. `src/features/workspace/` supplies the shared shell, authorized project search/empty states and local image brightness/contrast/saturation/blur adjustments, comparison/reset and real PNG export. `/studio/create` has labeled illustrative content and local import; authorized project image routes use the same editor. Edits are local and do not overwrite or save project assets.

## Database and APIs

`drizzle/0003_xr_workspaces.sql` adds the twentieth table: project-scoped JSONB layout, schema/layout versions and timestamps. Project membership supplies ownership. Existing session `scene_state` is unchanged. Atomic membership/asset predicates and compare-and-swap updates reject stale writes and concurrent first saves with HTTP 409. There are now four migrations to apply to a configured development database.

| Route | Behavior |
| --- | --- |
| `GET /api/xr/workspaces/[projectId]` | Authorized project/content catalog, edit capability and saved/default layout |
| `PUT /api/xr/workspaces/[projectId]` | Bounded layout plus expected version; atomic save |
| `POST /api/xr/workspaces/[projectId]/reset` | Expected-version reset to latest authorized content |
| `GET /api/xr/assets/[assetId]` | Validated, streamed private preview without storage URL leakage |
| `GET /api/xr/assistant/[projectId]` | Configuration readiness, not a claim of live verification |
| `POST /api/xr/assistant/[projectId]` | Authorized context, bounded reply and command proposals |
| `POST /api/xr/assistant/[projectId]/transcribe` | Consent header, bounded audio and supported language |
| `POST /api/xr/assistant/[projectId]/speak` | Bounded text to validated WAV |

Mutations retain trusted-origin, strict validation and authorization checks. Assistant operations share a durable per-user 20/hour budget. The standard asset viewer route is `/app/projects/[projectId]/assets/[assetId]`.

## Verification

Environment: macOS, Node 24.22.0, pnpm 11.12.0, desktop Chromium with software WebGL. No live service credentials or physical headset were configured.

| Check | Observed result |
| --- | --- |
| Frozen offline install and peer check | Passed; no peer issues |
| Drizzle generation | 20 tables; no schema drift |
| Unit/PostgreSQL suite | **306 passed**, 22 files |
| Final production browser run | **24 passed**: 12 actual Next application checks and 12 isolated editable-workspace component checks |
| Final lint, TypeScript and scoped formatting | Passed; zero lint errors/warnings |
| Optimized production build | Passed; all private routes remain dynamic |
| Visual/media inspection | Desktop/mobile XR, dashboard and image canvas inspected; decoded recording contains artwork and draft watermark; PNG export pixels verified |
| Source review | Independent review completed; identified issues fixed, targeted regressions and final combined suite pass |

The standalone browser harness bundles the actual client with explicit HTTP fixtures. It is outside deployed routes and cannot bypass production authentication. Its persistence checks prove browser behavior, while PGlite tests exercise real repository/route SQL with mocked identity/provider network boundaries. Neither establishes live Clerk/Neon connectivity. Actual A-Frame rendering/transforms are observed; simulated sessions cannot establish physical headset compatibility.

The original recorder uses synthetic microphone input with real rendering, MediaRecorder encoding/decoding, playback and download. Generated media/screenshots remain ignored under `test-results/final/`. The final command was `PLAYWRIGHT_BASE_URL=http://localhost:3002 PLAYWRIGHT_OUTPUT_DIR=test-results/final pnpm test:e2e` against a fresh production server. Earlier concurrent-session runs encountered a fixed-port collision and stale build assets; ephemeral harness ports, isolated output and a rebuilt stable checkout resolved them. The real model test also exposed and fixed a cross-frame ArrayBuffer mismatch before this passing run. Checks use the session-only `pnpm_config_verify_deps_before_run=false` override after a verified install because the restricted shell discovers a different pnpm store; repository supply-chain settings remain unchanged.

## Limitations and required acceptance

- **Live accounts:** configure Clerk domains/keys, Neon, private R2 and current Gemini/Sarvam model/speaker IDs. Apply all four migrations; verify sign-in, tenant denial, two-session conflicts, media delivery and real provider round trips. Readiness describes configuration only.
- **Assets:** no cloud upload pipeline or professional editor is introduced. The standard workspace provides local image adjustment/export and other media viewers. Models support a bounded static subset; extensions, animation, skins, morphs, sparse accessors and external resources are rejected. Embedded image metadata and aggregate decoded allocations are checked before loading. No server transcoding/optimization pipeline yet.
- **Persistence:** one shared project layout with explicit save; no realtime collaboration, merge UI, undo history or offline durability. Dirty-work guards cover same-origin links/full-page unload, not every client-side browser Back transition. Existing reviews are displayed; review authoring/approvals remain separate.
- **Hardware:** Quest and Vision Pro/Safari must verify entry/exit, tracking, controller mapping, recenter, disconnects, comfort and sustained frame rate on HTTPS. Edge, Safari and mobile 3D need real-browser checks. AR, hand tracking and native visionOS are not implemented. Assistant/voice controls live in the React companion UI; a headset-native assistant panel/keyboard is not implemented.
- **Speech/recording:** live language/model quality, real microphone handling and provider retention policies need account verification. The original physical Android codec/heat/second-device playback checklist remains open.
- **Deployment:** no remote migration, cloud resource, Vercel deployment, CI run or push is claimed for this change. Speech upload is capped at 4 MiB, TTS at 2 MiB and streamed previews at 20 MiB; verify host/proxy behavior in deployment.

## Next milestone and history

Next: configured-environment acceptance with real accounts and two users, followed by HTTPS headset/browser testing. Then add authorized uploads/asset optimization and richer creative/review workflows based on measured needs.

Initial commit `a1b8dc02b01244623916fa3c5493955eb762afce` already exists and was pushed in the original handoff. Foundation commit `b5652f1` remains on local `feat/xr-foundation`. Validated implementation commits are `2d75490` (persistence/assets), `72620dc` (assistant/voice), and `960d9b8` (combined studio/UI/tests). All remain local; unrelated history is preserved.

## Reference-led interface extension

Dashboard, project navigation and creative image canvas now follow the user's supplied visual references. The local image editor supports adjustments, presets, comparison, reset and real PNG download, and is reused behind the existing authorized image asset route. Full details, file inventory, test evidence and limitations are recorded in [the interface delivery report](superpowers/specs/2026-11-12-reference-studio-status.md). This pass verified 302 unit/integration tests and 24 production browser cases; lint, TypeScript and production build pass. It does not establish live provider or physical headset acceptance.
