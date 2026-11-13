# Spatial XR HUD — shell and connected dashboard

Implemented 13 November 2026. Scope follows the final execution instruction in [the supplied master prompt](../product/SPATIAL_XR_HUD_SPEC.md): audit the current runtime, then implement the shared shell and first functional dashboard. Full immersive authoring across all twelve proposed phases is not delivered in this increment.

## Open the application

Open `/xr/hud` directly, or **Spatial Studio → Open spatial workspace**. The verified local production server is `http://127.0.0.1:3180/xr/hud`; its separate R3F process runs internally on3181. Existing dev ports3000/3001 were preserved. Start a fresh pair with `pnpm dev --hostname 127.0.0.1 --port 3000` when those ports are free. Use the public portal port for the HUD, not the internal R3F port.

The current account/services are unconfigured. The public shell displays a connection notice and unknown metrics, without fabricated campaign rows. Authorized overview data appears after configuring Clerk/Neon and applying the existing application migrations through the established setup process. No new schema or migration is introduced here.

## Screenshot follow-up: stale public XR entry links

The reported screenshot matched `/xr/preview`, the older white interaction sample whose content is deliberately placeholder cards. Its graphics were rendering; generic entry links still led there instead of to the new HUD. Corrected the app header, old studio dashboard, project setup notice, public creation fallback and `/studio/xr` landing to `/xr/hud`. Authorized project XR routes and the explicit legacy sample remain available. The legacy sample now visibly says “Legacy interaction sample · placeholder cards only” and provides an “Open spatial workspace” button. The unconfigured HUD also links to the existing `/workspace/demo` procedural 3D object, without claiming it is a saved campaign asset.

Follow-up files: `apps/web/src/app/layout.tsx`, `apps/web/src/app/studio/xr/page.tsx`, `apps/web/src/features/workspace/StudioDashboard.tsx`, `apps/web/src/features/projects/ProjectAccessNotice.tsx`, `apps/web/src/features/playground/PreviewViewport.tsx`, `apps/web/src/xr/XRWorkspaceClient.tsx`, HUD shell/CSS and two new cases in `tests/e2e/spatial-hud.spec.ts`. Existing unrelated hunks remain preserved.

Both new entry regressions failed before the fix and pass afterward. Fresh `NEXT_PUBLIC_APP_URL=http://127.0.0.1:3180 pnpm check` passed14tasks,733tests/81files and both builds. All19 focused production Chromium cases passed, covering legacy→HUD navigation/scene teardown, setup entry, HUD rendering/privacy, original XR, image editing/export and recording flows. Inspected the updated HUD screenshot; whitespace and empty-index checks passed. Logs: `/private/tmp/shape-hud-entry-red.log`, `/private/tmp/shape-hud-entry-check.log`, `/private/tmp/shape-hud-entry-browser.log`. No live-service, native/device, deployment or commit claim. Suggested commit: `fix(xr): route spatial entry points to the current HUD`.

## Phase delivery and reviewable changes

| Phase | Files / components | Connected behavior | Suggested commit |
| --- | --- | --- | --- |
| Audit and state | `docs/product/SPATIAL_XR_HUD_SPEC.md`, `docs/superpowers/plans/2026-11-13-spatial-xr-hud.md`, `apps/web/src/xr/hud/hud-state.ts`, `tests/unit/spatial-hud.test.ts` | Actual route/renderer/service inventory; strict allowlisted navigation and bounded nonprivate view preferences | `feat(xr): establish bounded spatial HUD state` |
| Shared spatial surfaces | `apps/web/src/xr/hud/hud-surfaces.ts`; additive changes in `apps/web/src/xr/runtime/studio-adapter.ts` | Individual rounded canvas-backed surfaces, event-driven redraw, mouse/controller-ray dispatch, focused/compact recovery and Exit VR; same A-Frame scene/session/loop | `feat(xr-ui): add ray-selectable HUD surfaces and layout presets` |
| Desktop shell and dashboard | `apps/web/src/xr/hud/SpatialHUDShell.tsx`, `spatial-hud.module.css`, `apps/web/src/app/xr/hud/page.tsx`; new entry link in existing `features/platform/SpatialEntry.tsx` | Workspace overview API through existing strict session-aware data hook; real project selection/details, metrics, activity, tasks; explicit existing-tool handoffs, accessible navigation and dock | `feat(xr-workspace): connect spatial dashboard to workspace services` |
| Verification | `tests/e2e/spatial-hud.spec.ts`, `spatial-hud-data.spec.ts`, `tests/browser-fixtures/spatial-hud-entry.tsx`, `scripts/test-spatial-hud-harness.mjs`; both progress trackers and this report | Actual A-Frame/Canvas rendering plus isolated HTTP/account fixtures; no production auth bypass | `test(xr): verify HUD navigation privacy and fallbacks` |

All changes remain unstaged/uncommitted. Whitespace checking and native artifact drift checking passed. Earlier unrelated dirty files and generated design artifacts are preserved. The entry file already existed as untracked work before this increment; only its HUD link/description belongs to this change. Do not stage the whole directory/repository to package this slice.

## Implemented behavior

- Shape Studio dark lavender materials, rounded panels, system typography and consistent shell/navigation/dock. Local HUD styling does not change generated global tokens.
- Ten navigation contexts switch state and scene surfaces without recreating the iframe, renderer or XR session. Workspace and Projects use the real overview project collection. Other contexts explain their purpose and explicitly open existing web tools; their complete authoring interfaces are not embedded screenshots.
- Dashboard shows authorized counts, up to six accessible project cards/four spatial cards, progress only when supplied, client/deadline/objective, upcoming tasks and recent activity. No stock campaign product, thumbnail, approval or metric masquerades as private data. ALTÉR in tests is an explicitly isolated fixture.
- Desktop mouse/keyboard controls, Alt+1…5 shortcuts while shell controls are focused, drag-to-look/WASD on the canvas, selection, project details, layout reset and explicit recenter. Complex text entry stays in established accessible web editors.
- STANDARD/COMPACT/FOCUSED/IMMERSIVE view preferences and Dark Studio/Minimal Void/Creative Workspace presets. Minimal Void hides environmental geometry. Main/side/dock offsets are finite and bounded, stay in front and keep side panels out of the main horizontal space. Buttons disable at those bounds. Preferences persist locally; private project IDs, names, media, prompts and session state do not.
- A-Frame's existing laser controllers and mouse cursor share one allowlisted dispatcher. Individual surfaces are interactive geometry. Side panels/dock become geometry controls in immersive mode; All panels and Exit VR remain centrally reachable. Unknown actions/project IDs are ignored; read-only projects get an editable-project chooser for the assistant.
- Parent session changes remount/tear down the old runtime; denied overview results remove private DOM content and corresponding rendered textures. Requests retain the existing abort/session boundary. No extra microphone owner, provider integration, database, canonical scene format or render loop.
- Shape AI is an honest idle entry panel. Selecting an editable project opens its established Gemini/Sarvam project assistant. Voice capture, transcripts and assistant proposals do not run inside the new HUD yet. AR, hand tracking and grip repositioning are not enabled.
- Explicit capability detection and WebGL failure states retain the readable DOM dashboard/navigation. XR entry is user-triggered and unavailable controls remain disabled. Native SwiftUI/RealityKit and R3F remain independent.

## Verification

- Seven HUD unit cases pass. Navigation/invalid commands, finite bounds, safe storage, corrupt preferences, layout reset/private selection cleanup, focused immersive recovery and view-only assistant routing are covered. Relevant failures were observed before fixes.
- `pnpm check` passed all14 tasks,733 tests across81 files, lint/types/formatting, contract/token/native-copy drift and both production builds. Initial root lint caught ordinary anchor links; fixed using Next Link while retaining the intentional separate-app R3F handoff.
- Five focused Chromium cases passed before final typography/bounds refinements. They exercised real A-Frame initialization, actual mouse hover/canvas project selection, navigation without remount, persisted preferences, ray-event dispatch, malformed data/retry, permission/session teardown, keyboard/mobile, measured runtime counters and missing WebGL.
- Final production Chromium run:170 passed/one failed out of171; the failure was a test-origin mismatch (the spatial bundle embedded the normal3000 portal origin, while the test ran on3180). Rebuilding only spatial-web with `NEXT_PUBLIC_APP_URL=http://127.0.0.1:3180` corrected the environment. All24 affected portal/spatial/HUD cases then passed. All171 distinct cases therefore passed across the full run and targeted rerun; this was not a single clean171-case run. No product-code change was needed for that environment correction.
- Independent scoped review found compact immersive navigation recovery and a view-only inert assistant action. Both were reproduced with failing regressions, fixed and re-reviewed; no outstanding material finding remained. Final source review is not hardware acceptance.
- Desktop/mobile screenshots were inspected. Initial scene text was too small, prompting tighter desktop camera framing and font sizing by surface width. Final production desktop/mobile screenshots were inspected. One connected-fixture software Chromium sample showed28FPS,36.0ms/frame,22draw calls and224triangles. This is an observation from software rendering, not a target-device benchmark or a smooth-XR performance claim.

## Evidence and remaining gates

Local logs: `/private/tmp/shape-hud-check.log`, `/private/tmp/shape-hud-production-browser.log`, `/private/tmp/shape-hud-production.log`, `/private/tmp/shape-hud-origin-build.log` and `/private/tmp/shape-hud-origin-retry.log`. Browser artifacts live outside the repository at `/private/tmp/shape-hud-production-browser`. The local harness bundles only fixture session adapters and intercepts authorized DTO responses; those paths are absent from production.

No live Clerk/Neon/R2/Gemini/Sarvam requests, credentials, cloud writes, deployment, migration, commit or push occurred. Real-service end-to-end acceptance remains open. No native source changed, new Swift/Xcode/simulator run or physical-device verification is claimed. Controller event tests and mouse raycasting establish software interaction logic, not headset tracking fidelity or frame-rate performance. Software-rendered Chromium measurements are diagnostic observations only.

Later increments: full spatial brainstorming cards/layout persistence, in-HUD voice capture/validated commands, immersive editing/review authoring, asset thumbnails/previews, grip/hand manipulation, measured headset comfort/accessibility/performance and real account acceptance. Reuse the existing backend and preserve immutable outputs and canonical scene v1 as these are added.
