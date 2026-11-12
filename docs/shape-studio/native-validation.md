# Native implementation and validation

Executed 12 November 2026. Scope: the native foundation requested in the Spatial master specification, plus authorized project USDZ viewing/canonical scene saves and a local immersive study. This is not acceptance of the entire cross-platform product roadmap.

## Original native delivery verification

| Gate | Actual result |
| --- | --- |
| Web/API/PostgreSQL tests | 394 passed across 33 Vitest files; includes real signed JWT policy tests, SQL role/tenant/CAS checks, private USDZ bounds and authorization after storage read |
| Swift core tests | 48 passed across 9 suites; transport/limits/redirects/cancellation/refresh, project revocation, private draft lifecycle/CAS, scene mapping and immersive state |
| Swift contract fixtures | 11 JSON round trips, 9 invalid payload checks and rejection of malformed constructed vectors |
| Native simulator build | Passed for arm64 and x86_64 with Xcode 26.0.1 / Swift 6.2 / visionOS 26 SDK |
| Native device-target compilation | Passed for generic visionOS with signing disabled; no installation on hardware |
| Simulator UI tests | 3 passed: local prompt modes/navigation retention, product volume/inspector opening, explicit immersive entry/exit |
| Simulator RealityKit tests | 3 passed: actual procedural bounds/gesture history, actual USDZ local import/document restore, project-model failure/cancellation retention |
| Existing production browser flows | All 32 Chromium tests passed, including creative editing/export, responsive shell, private-route denial, A-Frame manipulation and original recorder regressions |
| Build and static checks | Production Next build, ESLint, strict TypeScript, formatting, contract/token/native-copy drift and git whitespace checks passed |

Native tests ran on the installed Apple Vision Pro simulator, visionOS 26.0, ID `D189D9B2-7EFE-4058-9CE9-307E148A7539`. Six final simulator tests passed in one run. The original authored 961-byte USDZ fixture is checked in with its deterministic generator; tests load it through RealityKit, not a mocked decoder. Project-model tests use local fixture bytes and do not claim an authenticated live R2 roundtrip.

The first simulator UI run also passed two cases before the final scene/credential review fixes. The final six-test run includes those flows on the final native sources. XCTest element screenshots and the default `simctl io screenshot` invocation did not produce usable visionOS images in that original run. The window-recovery follow-up below records later successful display captures using an explicit framebuffer port.

## Window recovery follow-up

A running app process did not establish that its main window was visible. A simulator capture showed product-study controls and, after repeated opening, an empty duplicate-volume warning. `WindowGroup` created another instance on every `openWindow(id:)` call, while the correct single-renderer guard refused to move the shared RealityKit root into the duplicate.

The workspace, product volume and inspector now use unique visionOS 26 `Window` scenes. Reopening brings the existing window forward. The workspace is the default launch scene; transient volume/inspector restoration is disabled. Both auxiliaries expose **Open Workspace**, and the volume offers **Close volume**. Paired open requests present the inspector first and the requested volume last. Volume appearance/disappearance symmetrically acquires/releases the renderer lease, and creation/update attach the root only while ownership is held. Geometry limits, private-data authorization and the single-owner guard remain intact.

The duplicate and missing-recovery regressions failed before implementation. Subsequent focused checks passed duplicate prevention, workspace recovery, close/reopen/relaunch, fresh-model accessibility/hittability and inspector recovery. Tests explicitly foreground the intended window before interacting with its controls. Final combined simulator run completed successfully: six UI tests and three hosted RealityKit tests, with one expected reopened-model accessibility failure and zero unexpected failures. All 48 native core tests and native artifact drift checks also passed. These results do not close the accessibility issue described below.

**Known accessibility issue:** after closing/reopening, the rendered model can be absent from the simulator's automation accessibility snapshot. A timed display capture (`/private/tmp/shape-volume-reopen-diagnostic.png`) shows the purple model actually rendered; temporary lifecycle tracing confirmed its root was scene-attached with valid geometry. Window order and re-registering the accessibility component did not resolve that snapshot issue. The ineffective component reset and all temporary diagnostics were removed. A strict `XCTExpectFailure` tracks only the reopened-model accessibility assertion; the close/reopen/relaunch assertions and fresh-model interaction check remain unconditional. This does not claim complete screen-reader acceptance or attribute the unresolved issue solely to Apple.

The test service also crashed during earlier attempts; restarting the simulator without erasing data restored execution. Local logs include `/private/tmp/shape-volume-regression-red-retry.log`, `/private/tmp/shape-volume-interaction-check.log`, `/private/tmp/shape-window-fix-core-tests.log`, `/private/tmp/shape-volume-lifecycle-diagnostic.log` and `/private/tmp/shape-window-final-validation.log`. Temporary files are execution artifacts, not committed dependencies.

After the final test run, the simulator was booted, the verified app reinstalled and launched, and `/private/tmp/shape-visionos-final-workspace.png` inspected. It visibly shows the main Shape Studio workspace, heading and **Open product volume** control. The app was left running.

To inspect the actual display, run `xcrun simctl io <device> enumerate`, then pass the UUID for `com.apple.framebuffer.display` to `xcrun simctl io <device> screenshot --display=<UUID> <path.png>`. Re-enumerate after simulator restarts; display UUIDs change. Inspect the image before claiming visibility. No new physical-device, live-account or remote-CI verification is claimed.

## Reproducible checks and local evidence

Use the commands in [native setup](../../apps/visionos/README.md). The final local run produced `/private/tmp/shape-spatial-ui-2.xcresult` and logs prefixed `/private/tmp/shape-spatial-`: `ui-2.log`, `build.log`, `device-build.log`, `core-tests.log`, `web-tests.log`, `web-e2e.log`, `web-build.log`, `swift-contracts.log`, `lint.log`, `types.log`, `format.log`. These are local execution artifacts and are intentionally not committed; rerun tests if temporary files are gone.

Build troubleshooting was resolved rather than hidden: Clerk 1.7.1's `weak let` failed on Swift 6.2, so the app pins compatible 1.5.8; an actor-isolated bound-method Binding triggered a compiler crash and was replaced with an explicit closure. Sandboxed Swift cache and Turbopack resolution failures were rerun with the necessary compiler access. Final command results above are successful. Xcode's unused App Intents metadata warning does not affect these app targets.

Independent backend/native reviews found and resolved multiwindow observer ownership, blocking account-event callbacks, stale selection after authorization refresh, failed Keychain-cleanup retry/relaunch behavior, late sign-in completion, same-project draft loss and canceled-load retry, and unrelated-window import cancellation. Changing projects or refreshing a project model asks before discarding local work.

## Open acceptance gates

- Configure the real Clerk Native API registration/bundle ID, hosted login/logout, account switching and recovery on simulator/device. Public config remains empty; no fake identity or secret-bearing login was added.
- Deploy migration 0005 and validate live Clerk/Neon/R2 private project, asset, draft and scene flows. No live database/account/provider changes were made.
- Add real media-generation orchestration and native conversation/voice/review services before enabling those controls. Current capability catalog correctly reports unavailable generation.
- Implement USDZ ingestion/conversion and derivative provenance; the new route serves only existing ready authorized USDZ. Source GLB/glTF is not silently converted.
- Further harden native USD decoding against adversarial complexity/external references and measure peak allocation. Archive limits and post-load mesh budgets alone do not bound decoder memory.
- Validate actual Vision Pro gaze/pinch, accessibility, comfort, permissions, memory and frame pacing. Simulator gestures and device-target compilation do not establish those results.
- Complete multi-object immersive composition, lighting/material workflows and full MSME collaboration in later increments.

CI now checks native artifact drift, Swift core tests and a simulator-target build on `macos-26`; this workflow change has not been run remotely. No push or deployment was performed. The initial repository commit and all prior web/XR history are preserved.
