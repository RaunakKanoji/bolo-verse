# Product viewer boundary

The viewer uses a finite SwiftUI volume and RealityKit entities. Native targeted gestures and the numeric inspector share the same transform constraints. There is no raw hand, gaze, or world-tracking session. Imported animation and physics are stopped before attachment; there is no continuous decorative motion. Explicit transformations are immediate, including when Reduce Motion is enabled.

The hierarchy is `volume root → user pivot → normalization → imported model`. Models are recentered and normalized to a 0.16 m bounding sphere. Actual volume dimensions come from `GeometryReader3D` converted into RealityKit coordinates. Position and uniform scale are constrained so the sphere stays inside all bounds with a 0.02 m margin, including after rotation or resizing.

## Imports and resources

- USDZ file and total declared expansion: at most 32 MiB; at most 64 entries.
- Stored ZIP entries only, as required by USDZ. ZIP64, encryption, descriptors, symlinks, duplicate paths, unsafe paths, overlapping entries, and mismatched local/central metadata are rejected.
- Supported package members: USD/USDA/USDC and PNG/JPEG. At most 16 single-frame textures, each no larger than 4,096 × 4,096, and at most 16,777,216 pixels combined. Image dimensions are checked before RealityKit loading.
- After asynchronous native decoding, before attachment: at most 256 entities, 250,000 vertices and triangles (instances conservatively counted), and 64 material slots. Empty/nonfinite geometry is rejected.

These checks bound accepted input and rendered resources. They do not establish a hard peak-memory bound inside Apple's native USD decoder. Device profiling and hostile binary USD testing remain required before raising these limits.

Local imports are copied into app-private storage only after validation. At most eight files and 128 MiB are retained; they are excluded from backups. JSON scene documents refer to those copies by UUID and never embed filesystem paths or model bytes. Restoring on another installation, or after removing imports, requires the model again. Temporary files are removed on success, failure, and cancellation.

Authorized project previews use a separate source case. They load bounded backend bytes through temporary files and do not enter the persistent local-import store. Session/project changes must cancel loading and replace the private viewer content; the application coordinator owns that transition.

## Shared scene coordinates

Canonical project transforms use metres, right-handed +Y up, -Z forward, and unit XYZW quaternions. Save/restore accounts for the model's native centre and normalization scale; it does not serialize the display-only fit scale as though it were the source-model scale.

Project controls load a revision without altering the current object. Applying the saved transform is explicit. Nonuniform scale, an out-of-volume transform, multiple instances of the same asset, and values beyond the shared schema's physical ranges are reported without silently changing the saved scene. Saving preserves all unrelated objects and existing object identity, and uses the loaded revision for compare-and-swap. A conflict retains local edits and requires a reload.

## Verification

Core tests exercise invalid transforms, bounds, cumulative gesture deltas, history, local serialization, ZIP metadata/texture rejection, canonical basis conversion, stable identity and preservation of other objects. Swift 6 typechecking against the installed visionOS 26 SDK is separate from simulator/device acceptance. Actual gaze/pinch ergonomics, VoiceOver operation, comfort, GPU memory, and headset performance require device validation.

## Window ownership and recovery

The main workspace, volume and inspector use unique visionOS 26 `Window` scenes. Repeated `openWindow(id:)` requests bring the existing scene forward instead of creating another view that competes for the shared RealityKit root. Keep the renderer ownership guard in place. The transient volume/inspector opt out of restoration and default launch; the workspace is the main launch scene. Both auxiliaries provide an explicit route back to the workspace. This follows [Apple window-opening semantics](https://developer.apple.com/documentation/swiftui/openwindowaction) and [scene restoration guidance](https://developer.apple.com/documentation/visionos/embedding-controls-in-an-immersive-space).

Volume appearance acquires the renderer lease; disappearance releases it. The RealityView creation/update closures attach the root only while that view owns the lease, so a retained view can restore its model after reopening. The UI regression verifies initial model accessibility/hittability and window recovery. A strict expected failure tracks the reopened-model accessibility snapshot issue; display capture independently confirms rendered geometry. See the native validation notes for that limitation.
