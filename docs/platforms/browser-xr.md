# Browser spatial application

The preserved legacy browser workspace is A-Frame based. `apps/web/src/xr` owns its client workspace, runtime adapter, serialization, interactions and assistant UI. Existing `/xr` and `/studio/xr` routes remain available. A-Frame is isolated from the ordinary Next UI and from the original direct Three.js recording renderer.

Desktop 3D works without a headset. Immersive entry requires runtime capability checks and explicit user action; unsupported/rejected sessions return to usable desktop controls. Browser/device support must be detected, including on visionOS Safari. A successful native Vision Pro build proves no browser WebXR capability.

The runtime uses its own A-Frame Three.js instance. It must not share ownership of a scene/canvas/render loop with React Three Fiber or import a second Three.js engine into A-Frame entities. Protected previews enforce supported formats and decoded-resource budgets and dispose owned resources on teardown.

Current saved A-Frame workspaces use `XRLayout` with Euler XYZ degrees, project-derived panels/assets and revision checks. They are persisted separately from canonical quaternion scenes. Reusing the same projects and assets is implemented; identical cross-renderer saved scenes are not yet implemented.

## Canonical desktop editor

`apps/spatial-web` owns the R3F editor at `/workspace/:projectId`. Its Next shell loads project, asset and strict v1 scene data through authorized APIs; its browser runtime owns a separate canvas. `/workspace` provides the project entry point. The web gateway routes only workspace and spatial-static paths to this deployment; the API, A-Frame iframe and recorder remain web-owned.

The editor supports canonical object placement/selection/transforms, accessible numeric controls, local undo/redo and explicit revision-aware saves. Conflicts retain local changes. Asset compatibility and unavailable previews remain explicit; unsupported document objects are preserved. See the migration status for exact tested behavior and limits.

Immersive R3F sessions, unified voice and complete cross-renderer layout conversion remain later slices. Existing A-Frame immersive entry is preserved separately. Canonical scenes, legacy Euler layouts and recording documents still have independent persistence.

Browser regression coverage retains desktop fallback, actual supported media/model decoding, teardown, conflict retention and recorder output. Physical headset/controller interaction and measured rendering performance remain device acceptance gates.
