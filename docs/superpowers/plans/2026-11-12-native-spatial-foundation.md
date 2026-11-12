# Shape Studio Spatial implementation plan

> For agentic workers: implement independent native networking, server policy and RealityKit tasks in parallel, then perform independent review and whole-application validation.

**Goal:** Deliver a genuine visionOS application with native windows, authorized shared-backend services, a working bounded RealityKit viewer, and explicitly entered immersive exploration.

**Architecture:** Preserve the root web app and shared backend. Add an Xcode application under `apps/visionos`, a Foundation/Observation Swift package for testable networking and state, and a ClerkKit hosted-auth adapter. Extend v1 authentication and canonical scene persistence without changing legacy XR storage or browser mutation rules.

**Tech stack:** Installed Xcode 26.0.1, Swift 6.2 strict concurrency, visionOS 26 deployment target, SwiftUI, RealityKit, Observation, URLSession, ClerkKit 1.5.8, existing Next/Clerk/Drizzle.

**Spec:** [Native master specification](../../shape-studio/SPATIAL_MASTER_SPEC.md). This supersedes the previous restriction to web foundation work. First complete the six requested native foundations, then connect available creation capabilities and explicit immersive lifecycle. Unimplemented backend generation capabilities remain unavailable rather than being simulated.

## Environment and repository audit

The repository moved to `/Users/admin/Code/VR` and is clean at `0f0d407`; its initial commit and prior validated web implementation remain intact. Work is isolated in `/private/tmp/shape-spatial-native` on `feat/shape-spatial-native`. The current app has 21 tables, versioned project/assets/draft APIs, server membership predicates, bounded R2 previews, generated OpenAPI/Swift models, and shared design tokens. No native Xcode app, native session policy, canonical scene persistence, native USDZ delivery or creative generation orchestration exists.

Installed SDKs include visionOS 26 and its simulator. Elevated simulator inventory confirms an Apple Vision Pro simulator (visionOS 26); initial sandbox-only inventory failed. This is not yet simulator execution or physical-device validation. No new design-reference image is attached; use native system materials and the established lavender tokens.

## Decisions and rationale

- Use a checked-in Xcode project and a local Swift package; Swift sources remain independent of pnpm. A sync/check script copies generated transport/token artifacts into the package so its manifest never reaches outside its package root.
- Use native SwiftUI windows and RealityView, never a WebView dashboard. Keep networking and Codable state outside views. Native system targeting handles gaze/pinch without raw tracking providers or permissions.
- Pin only ClerkKit 1.5.8 (actual compiler rejected 1.7.1 weak-let syntax); use hosted state/PKCE authentication and SDK Keychain storage. Missing public configuration shows setup guidance. No fake account, embedded server secret or pasted bearer-token login.
- Verify native session bearer JWTs explicitly on v1 requests. Cookie writes still require an exact trusted Origin; any supplied Origin must remain trusted. Invalid Authorization must not fall back to cookies. Existing project-role SQL predicates remain the authority.
- Add a separate canonical project scene with revision CAS. Stable scene/object identities, finite metre/Y-up transforms, unit XYZW quaternions and authorized ready asset references are enforced. Do not reinterpret existing Euler layouts.
- The first real viewer supports a labelled procedural study and explicit local USDZ imports with bounded validation, native manipulation and export/restore of local scene documents. Local imports are not uploaded or presented as server assets. Existing backend GLB/glTF assets are not advertised as RealityKit-compatible USDZ.
- Add remote scene persistence services and capability-aware native prompt editing over the real APIs. Generation remains disabled while the shared backend reports `not_implemented`; building a separate native generation backend would violate the shared-backend requirement.
- Keep immersive entry optional, explicit and reversible; no automatic restoration into immersive mode. Do not claim physical comfort, hand tracking, headset performance or live Clerk/provider access from simulator builds.

## File-level tasks and interfaces

### 1. Native project and core contracts

Files: `apps/visionos/ShapeStudio.xcodeproj`, `ShapeStudio/App/*`, `Config/*`, `ShapeStudioCore/Package.swift`, `scripts/sync-native-contracts.mjs`.

- [x] Configure visionOS 26, Swift 6, multiwindow support, placeholder bundle ID and local configuration overrides.
- [x] Sync generated API/token sources deterministically into `ShapeStudioCore/Sources/ShapeStudioCore/Generated`; drift check in CI.
- [x] Build the app with signing disabled for the installed simulator SDK.

### 2. Shared API authentication and scene persistence

Files: `src/server/auth/api-identity.ts`, v1 route wrappers, `src/server/db/spatial-scenes.ts`, schema/migration 0005, spatial contracts/registry/generator and focused SQL/JWT tests.

Interfaces: `getV1Subject(request, {mutation?})` returns a verified subject. `GET/PUT /api/v1/projects/{projectId}/spatial-scene` returns `{scene:{projectId,sceneId,revision,document,updatedAt,canEdit}}`; PUT accepts `{expectedRevision,document}`. Document uses the existing canonical `sceneId/version/objects` representation plus explicit units/coordinate semantics in contract documentation.

- [x] Test bearer signature/expiry/malformed-header/no-cookie-fallback and Origin matrix before enabling native writes.
- [x] Test owner/editor/client/outsider, first-save races, stale revision, cross-project/non-ready assets, stable scene identity and immutable legacy layouts.
- [x] Implement bounded reads/writes with SQL predicates, durable limits and structured errors.
- [x] Publish cookie-or-bearer security and narrowly supported fixed numeric tuples; verify Swift scene round trips and malformed vectors.

### 3. Native services and session state

Files: `ShapeStudioCore/Sources/ShapeStudioCore/Networking/*`, `Services/*`, `Models/*`, `State/*`, tests; app `Core/Authentication/ClerkAuthenticationService.swift`.

Interfaces: an async `TokenProviding` protocol, actor `APIClient`, typed project/asset/capability/draft/scene services, MainActor observable project/session state. Root app injects services and configuration; views never create requests.

- [x] Test JSON decoding, HTTP/authorization errors, exact host/path bounds, token refresh limit, cancellation, timeout and stale project loads.
- [x] Implement ephemeral URLSession without persistent cookies/cache, bounded payloads and explicit failures. Never log tokens or private response bodies.
- [x] Implement hosted Clerk sign-in/sign-out and session-driven cancellation/clearing. Live account acceptance remains separate.

### 4. Native workspace and creation windows

Files: app `Features/Workspace`, `Projects`, `AssetLibrary`, `CreativeStudio`, `AIAssistant`, `ClientReview`, `Core/DesignSystem`.

- [x] Implement native navigation, project loading/detail, asset metadata/compatible image preview and four-mode prompt drafts.
- [x] Render unsupported generation/review/conversation operations as unavailable with precise explanations; no invented clients/deadlines/history.
- [x] Provide collapsed auxiliary controls, system typography/materials, accessibility labels, visible loading/retry and state reset on session/project changes.

### 5. Bounded RealityKit volume

Files: app `Spatial/*`, `Features/SpatialStudio/*`, core transform/document utilities and unit tests.

Interfaces: `SpatialWorkspace` owns the selected local model/document; `ProductVolumeView(workspace:)` and `SpatialInspectorView(workspace:)` share that state. Renderer entities remain MainActor-only and separate from Codable transforms.

- [x] Test finite transforms, bounds after rotation/resize, cumulative gestures, undo/redo and local document serialization.
- [x] Implement async local USDZ validation/loading, cancellation, recenter/normalization, selection, numerical controls and targeted gestures.
- [x] Keep the selected object inside converted volume bounds with a conservative bounding sphere; release files/entities/tasks on replacement/teardown.
- [x] Exercise actual model loading, transforms and restore in simulator where available; report unsupported/device-only interaction separately.

### 6. Explicit immersive lifecycle, review and handoff

Files: app `Spatial/Environments`, presentation coordinator, native tests/UI tests, `docs/shape-studio/native-*`, context/root trackers and CI.

- [x] Add explicit enter/exit with closed/opening/open/closing states and cancellation/failure handling, using the same local study in a calm mixed space.
- [x] Run Swift package tests, simulator/device-target builds, simulator launch/UI checks, shared contract drift, web lint/types/unit tests and relevant browser regressions.
- [x] Perform independent security/lifecycle review; fix material findings.
- [x] Update phase evidence and remaining provider/account/device gaps; commit locally and make the native branch available in the primary checkout.

## Review focus and risks

1. Sign-out/project changes during slow requests must cancel or discard private results; test late completion.
2. Bearer plus foreign Origin, malformed bearer plus cookies, and role revocation must fail closed; test real JWT verification and SQL predicates.
3. Imported models can expand or consume excessive memory; enforce container/file/model budgets and expose rejected-format errors before attaching entities.
4. Cumulative gestures, volume resizing and restored corrupt transforms must not cause runaway movement, clipping or nonfinite state; test math independently.
5. Immersive cancellation and repeated open/close must leave the main workspace usable; simulator scenarios and explicit state-machine tests cover it.

Live native registration, hosted auth, configured backend/storage/provider calls and physical Vision Pro validation are external acceptance gates. Generation jobs, USDZ conversion/upload, organizations administration and full collaboration remain absent shared services; document these accurately rather than presenting local examples as production integrations.

## Implementation extension

The bounded viewer also opens eligible authorized USDZ project assets via a separate native-content endpoint. Native scene controls map fitted viewer transforms back to source-model coordinates and use shared revision CAS. Browser preview formats/limits are unchanged. See native architecture and validation for the final implementation and dependency compatibility decision.

## Completion evidence

All implementation tasks above are complete for this increment. Actual results: 394 web/API tests, 48 Swift core tests, six visionOS simulator tests (three UI and three real RealityKit tests), 32 production browser cases, simulator/device-target compilation and contract/static/build gates passed. Live account flows and physical-device acceptance remain open as documented in [native validation](../../shape-studio/native-validation.md).
