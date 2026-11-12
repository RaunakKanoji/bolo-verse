# Interaction system

The navigator, scene selection and inspector operate on the same validated scene document. Accessible HTML controls and spatial controls share the deterministic transform functions in `src/xr/interactions/transform-controls.ts`.

## Desktop workflow

1. Select an object in the canvas or its **Inspect** button in the project navigator. The inspector shows the authorized content represented by that object.
2. Drag the canvas to look around. W/A/S/D moves the camera while the canvas has focus. **Reset view**, **Standing** and **Seated** recenter the view; they do not change the saved object layout.
3. Use the inspector to move the selection in 0.25 metre steps on X/Y/Z, rotate around Y in 15° steps, or scale it. **Reset object** restores that object's default transform locally.
4. Choose **Save workspace** to persist an editable project's layout. **Reload saved layout** asks before discarding dirty local work. **Reset layout** requires confirmation and writes the default layout as a new version.

Transforms clamp to the shared bounds: positions −30…30 metres per axis, rotation −360…360 degrees and scale 0.1…10 per axis. The core interface uses explicit controls; it does not claim freeform object dragging or a full 3D authoring gizmo.

The public preview permits local rearrangement but disables saving. Assigned project clients can inspect content and previews but cannot mutate layouts or use the assistant. Server-side authorization remains authoritative even if a browser control is manipulated.

## VR and assets

The adapter maps controller ray/trigger selection to the same selected-object state. Spatial buttons provide bounded move, turn and scale actions. Head tracking and `local-floor` session behavior depend on actual browser/device support. Entry/exit and rejection handling are implemented, but controller usability and comfort require physical verification.

Asset previews are lazy: **Preview in studio** loads a protected image/video/model; **Open asset** opens the companion preview/download. **Open in Editor** returns to the standard project asset page, not a new professional media editor. PDF assets remain document cards/downloads. Preview request generations prevent a late failure from an older selection replacing the current selection's state.

## Save and error recovery

Successful saves update the baseline/version only after a valid server response. A 409 conflict, expired session or unavailable service preserves dirty local transforms. There is no automatic merge or silent overwrite; reload the saved version when ready to discard local changes. A timed-out mutation may have reached the server, so reload before retrying. Local dirty state does not survive a full reload; navigation warnings are a safeguard, not durable draft storage.

The assistant returns proposed actions. Opening/focusing uses authorized IDs, idea generation requests another bounded reply, and workspace reset requires explicit confirmation. Voice ownership and cleanup are described in [AI integration](ai-integration.md).

Development-only statistics display measured approximate FPS, frame time, draw calls and object count. They are diagnostics, not a performance guarantee or a substitute for headset measurements.
