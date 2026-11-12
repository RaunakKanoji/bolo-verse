# Native visionOS application

`apps/visionos/ShapeStudio.xcodeproj` is a genuine SwiftUI/RealityKit app, with a separate `ShapeStudioCore` Swift package. It is outside the JavaScript workspace graph and is not a WebView wrapper. Its generated contracts/tokens come from the same language-neutral sources used by the web app.

Implemented windows cover the workspace, projects, assets, private prompt drafts, image preview and spatial inspector. The app declares a bounded product volume and an explicitly entered mixed-immersion study. Standard system targeting and native gestures provide interaction without raw eye/hand tracking.

The Swift core owns URLSession transport, generated Codable models, typed services, session/project/draft state and spatial math. Private services call the shared v1 APIs using the configured Clerk instance. The app owns a single session observer across windows; cancellation and identity tickets prevent late private responses from reappearing after account/project changes.

RealityKit loads labelled procedural geometry, explicit bounded local USDZ imports and eligible authorized project USDZ. Project models use temporary files rather than a persistent cache. Canonical save/restore reverses viewer centering/fit, preserves unrelated objects and uses revision CAS. Multiple instances of one asset, unsupported nonuniform scale and out-of-volume restores are rejected explicitly.

The first viewer supports one selected compatible model; the immersive study is local exploration, not full multi-object scene composition. Native AI conversation, microphone capture, client approvals and realtime scene subscriptions remain unimplemented. USDZ delivery does not convert GLB/glTF or implement uploads.

Clerk registration, bundle signing/public configuration and live account acceptance are described in [native setup](../../apps/visionos/README.md). Do not embed long-lived server/provider secrets. Keep v1 strict decoding compatible when extending the backend; see [scene version ADR](../adr/0002-scene-version-compatibility.md).

Prior simulator tests exercised native navigation, volume opening, immersive exit and actual USDZ decoding/restore; [native validation](../shape-studio/native-validation.md) records that run. Phase 1 monorepo checks must distinguish newly executed contract/core checks from that historical rendering evidence. CI native validation is independent of unrelated web changes.

Physical-device gaze/pinch, comfort, accessibility, permissions, frame pacing and peak memory still need a real Vision Pro. Archive bounds and post-load geometry budgets do not guarantee peak native USD decoder allocation; adversarial input hardening remains an explicit production task.
