# Three application restructuring

Updated 12 November 2026. This milestone follows the completed monorepo foundation and implements the application split requested in the subsequent engineering prompt.

## Delivered boundaries

- `apps/web`: existing Next portal, modular backend, isolated A-Frame workspace, image editing/export and original mono recording lab. Existing private API and browser URLs are retained.
- `apps/spatial-web`: independent Next shell and R3F desktop canonical editor at `/workspace/:projectId`, with a public `/workspace` entry. Supports selection, placement, pointer/numeric transforms, undo/redo and explicit revision-aware saves/reloads.
- `apps/visionos`: existing independent SwiftUI/RealityKit Xcode application. No native source or generated wire artifact is changed by this restructuring.

The root source/public/Next/PostCSS configuration moves into web. Root scripts still own tooling, migrations, SQL/browser tests and contract/token generation. Path-sensitive aliases, environment preloading, asset preparation, lint/format rules, CI classification and build outputs follow the new source locations. Root `dev/start` runs both browser apps and tears down their owned processes. The gateway uses request-time forwarding with exact path/origin checks, allowing custom startup ports after production builds.

## Contracts and capabilities

R3F 9.5.0 is the new renderer dependency, paired with the existing React/Three versions. Both apps use the existing Clerk SDK/version where session lifecycle is required. Root tooling retains direct development dependencies needed by tests and code generation. No database migration or scene schema change is introduced.

Canonical v1 remains strict: one scene per project, stable IDs, XYZW unit quaternions, existing bounds and revision CAS. Legacy A-Frame Euler layouts and recorder state remain independent. Native-compatible canonical data is shared through APIs; complete native/browser rendering parity and conversion are not implied.

The R3F preview supports static embedded GLB and bounded raster assets through authenticated server previews. Existing server validation enforces decoded model/image resource budgets before delivery; the client additionally bounds streaming bytes, rejects redirects/external resources and disposes owned resources. At most four visible previews and 40 MiB source bytes are decoded together. Other objects remain in the document with explicit preview limitations. There is no upload/conversion, R3F immersive, realtime or unified/native voice claim.

Private browser session lifecycle uses a publishable-only Clerk client and session-scoped request cancellation. Mutations obtain a fresh signed token through the SDK; all browser API/media tokens remain transient headers to existing authorized v1 routes. Session changes clear the old editor and obtain fresh authorized project data. Client session state never grants project access: every API/media request remains server verified. No provider, database or storage key is required in the spatial application.

## Verification record

- Baseline: 425 tests in 36 files passed before relocation.
- Initial integrated check: 14 Turbo tasks passed, including both Next production builds, lint, strict types, formatting, environment checks, generated contract/token/native-copy drift and 441 tests in 41 files.
- Initial production Chromium run: all 39 cases passed through the custom-port gateway, including existing XR/image export/mono recording and seven new spatial cases.
- Swift contract typecheck passed: 11 bidirectional fixtures, nine rejected payloads and native request/route checks. All 48 native core tests passed independently.
- Independent review identified browser session renewal and account-boundary gaps. Both were fixed with a publishable-only Clerk browser provider, fresh transient bearer tokens for writes, session-keyed fresh authorization and lifetime cancellation. Targeted independent re-review found no remaining material issue in those areas.
- Final `pnpm check`: all 14 tasks passed, including 444 unit/PostgreSQL tests in 42 files and both Next production builds. Final full production Chromium run: all 42 cases passed, including the three new StrictMode renewal/session-transition cases. Frozen offline install, root types, focused final lint and `git diff --check` passed.
- All 135 tracked former source/public files have relocated targets. Native source, neutral generated API/token artifacts and OpenAPI wire outputs have no changes in this milestone. Production tests used the real request-time gateway at ports 3200/3201 after default builds, proving runtime port configuration. Launcher shutdown releases both listening ports.

All authorized editor browser cases use isolated test-only HTTP fixtures; the production gateway tests exercise real routing and fail-closed unconfigured access. There is no production auth bypass. Synthetic microphone/XR inputs, local tests and native core compilation do not establish live Clerk/Neon/R2/provider behavior, a new native simulator run, physical-device interactions or performance budgets.

No remote push, deployment, live migration or account configuration is performed. Follow [local setup](local-setup.md), [deployment and rollback](deployment.md) and [ADR 0004](../adr/0004-three-application-boundaries.md).

## Remaining acceptance gates

Live Clerk sign-in/renewal/sign-out, deployed multi-application routing, real private storage/provider calls and physical Vision Pro/WebXR interactions remain unverified. A direct visit whose initial SSR cookie read returns 401 can show the sign-in notice until revisited after browser session recovery; live registration and recovery testing remains required. No simulator/device run is claimed by this milestone. Organization administration, realtime, asset conversion and richer native/scene features remain later work.

## Development startup recovery

A previously running bare `next dev` process still used the removed repository-root app and returned the reported `/_not-found/page` runtime error with an empty root dev manifest. The correct launcher produces app-local dev manifests and serves home/workspace successfully. The unrelated port-3000 service was preserved; the repaired app was left running at `http://127.0.0.1:3001` with spatial on 3002.

Shutdown testing exposed a separate managed-shell `EPERM` on negative-PID process-group signals. Removed detached process groups and signal the owned Next CLI children directly; their own handlers stop their workers. The isolated launcher regression starts real fixture HTTP child processes under the same negative-PID restriction, checks each app CWD, then asserts clean exit and released ports. It fails the saved pre-fix behavior and passes the fix. Real Next dev stop/restart was also verified with no remaining locks/listeners.

The added 404 browser case failed with HTTP 500 before recovery and passed afterward. Seven selected Chromium cases passed on the actual development servers, including responsive navigation, the spatial gateway and fail-closed private reads. See [startup instructions](local-setup.md) for restarting an old checkout and choosing an available port pair.

Final recovery check: `pnpm check` passed all 14 tasks, 445 tests in 43 files, lint/types/drift checks and both production builds. Development browser verification passed seven selected cases. Source/whitespace checks passed; no native sources, API contracts or credentials changed.

## Commit-packaging verification — 12 November 2026

The existing implementation is packaged on `feat/three-application-spatial-editor`, with architecture planning, implementation and delivery documentation in separate commits. The verified implementation commit is `f88536b`.

- Fresh `pnpm check` passed all 14 tasks, 445 tests in 43 files and both production builds. The first sandboxed run passed 444 tests but could not bind a local port for the launcher test (`listen EPERM`); rerunning with local-server access passed the complete check.
- All 43 Chromium cases passed against the production gateway on ports 3400/3401, including recording, local image export, A-Frame, canonical editing, session transitions and 404 recovery. These retain the existing fixture and synthetic-input boundaries.
- `pnpm contracts:test:swift` passed Swift 6 typechecking, 11 bidirectional JSON fixtures, nine invalid payloads, native request construction and route encoding. Native source and generated API/token artifacts did not change; no native application build, simulator test or physical-device test was rerun.
- Staged files were reviewed for generated output and known credential patterns. No such candidate was found; this is not an exhaustive historical secret scan. The lockfile and all 135 source/public relocation targets are included.

No audit-roadmap fixes, live migration, provider account call, remote push or deployment is included in this packaging. The remaining live-service, hardware and recovery gates above stay open.
