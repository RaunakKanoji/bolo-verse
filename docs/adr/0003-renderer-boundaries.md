# ADR 0003: Isolate renderers behind platform-independent scene data

Status: accepted architectural direction; Phase 1 preserves working renderers and extracts only the pure scene schema.

## Context

The repository has a functional A-Frame workspace, a separate direct Three.js recording lab and a native RealityKit viewer. They share project identity and authorized assets but do not yet share a complete persisted scene/edit-operation model. The new target calls for React Three Fiber as the primary custom browser editor.

Mounting A-Frame and R3F as competing owners of one scene/canvas would introduce resource, lifecycle and engine-version conflicts. Swift cannot share executable Three.js objects or React state. Replacing working renderers during a tooling migration would provide no complete cross-platform editing slice.

## Decision

Keep the existing browser experiences and native app operational. Phase 1 introduces no R3F dependency or empty spatial application. The future R3F editor gets a dedicated route/application when it can load, edit, save and reload authorized canonical project scenes.

Pure scene validation and coordinate adapters belong in `@shape/scene-schema`; renderer-specific entities, effects and loops stay in their respective applications. A later scene-engine package may own deterministic updates/history once a real consumer exists.

Future `ThreeSceneRenderer`, `AFrameSceneRenderer` and native `RealityKitSceneRenderer` boundaries should load supported documents, resolve authorized assets, apply updates and report capabilities. They must have explicit ownership/disposal of render loops, loaded assets, input sessions and temporary resources. These named interfaces are planned, not shipped aliases for unrelated existing classes.

A-Frame uses `AFRAME.THREE`; do not inject the recording/R3F Three.js instance into its entities. The recorder continues to own its mono capture surface. Native uses SwiftUI controls and RealityKit entities; it does not embed the browser editor.

Capabilities describe implemented and currently available behavior: immersive sessions, controller/hand interactions, anchors, materials and presence cannot be inferred from a platform name. Unsupported operations must fail clearly or offer a supported alternative; never silently discard persistent scene data.

## Consequences and acceptance

Preserved clients remain usable during incremental migration. The later R3F slice must prove canonical scene save/reload, asset compatibility, transforms, accessible controls and lifecycle cleanup before becoming the primary editor. Cross-platform parity is feature-specific, not a promise that all materials, shaders, animation or device input translate identically.

Use [browser platform guidance](../platforms/browser-xr.md) and [scene version compatibility](0002-scene-version-compatibility.md) together. Browser tests, native simulator tests and physical-device validation remain distinct evidence.
