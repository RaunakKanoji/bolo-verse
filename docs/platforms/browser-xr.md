# Browser spatial application

The current functional browser editor is A-Frame based. `src/xr` owns its client workspace, runtime adapter, serialization, interactions and assistant UI. Existing `/xr` and `/studio/xr` routes remain available. A-Frame is isolated from the ordinary Next UI and from the original direct Three.js recording renderer.

Desktop 3D works without a headset. Immersive entry requires runtime capability checks and explicit user action; unsupported/rejected sessions return to usable desktop controls. Browser/device support must be detected, including on visionOS Safari. A successful native Vision Pro build proves no browser WebXR capability.

The runtime uses its own A-Frame Three.js instance. It must not share ownership of a scene/canvas/render loop with React Three Fiber or import a second Three.js engine into A-Frame entities. Protected previews enforce supported formats and decoded-resource budgets and dispose owned resources on teardown.

Current saved A-Frame workspaces use `XRLayout` with Euler XYZ degrees, project-derived panels/assets and revision checks. They are persisted separately from canonical quaternion scenes. Reusing the same projects and assets is implemented; identical cross-renderer saved scenes are not yet implemented.

## Planned primary custom editor

The new custom browser editor will use React Three Fiber, with Drei and WebXR helpers only where the actual slice needs them. Keep A-Frame as an isolated experience/adapter. Phase 1 does not add these dependencies or pretend the existing renderer has been replaced.

The R3F slice must load server-authorized canonical scene data, resolve supported assets, select/place/transform objects, expose accessible numeric controls, save with revisions and recover the same state on reload. Renderer entities must not become the persisted project model.

Define renderer capabilities and deterministic scene operations before adding cross-platform command execution. Unsupported materials, hierarchy, controllers or anchors must produce a clear limitation instead of being silently simulated. See [renderer boundaries ADR](../adr/0003-renderer-boundaries.md) and [scene format](../architecture/scene-format.md).

Browser regression coverage must retain desktop fallback, actual decoded GLB/glTF/image/video previews, late-failure isolation, teardown, conflict retention and recorder output. Physical headset/controller interaction and measured rendering performance remain separate device acceptance gates.
