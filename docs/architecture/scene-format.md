# Shared scene format

The pure [scene-schema package](../../packages/scene-schema/src/index.ts) owns canonical v1 validation and orientation conversion. Existing callers retain the compatibility import at `apps/web/src/lib/contracts/spatial-scene.ts`. Neither location may import a renderer, browser API, database or authentication runtime.

Canonical document shape:

```json
{
  "sceneId": "11111111-1111-4111-8111-111111111111",
  "version": 1,
  "objects": [{
    "id": "object_001",
    "assetId": "22222222-2222-4222-8222-222222222222",
    "position": [0, 0, -1],
    "rotation": [0, 0, 0, 1],
    "scale": [1, 1, 1],
    "visible": true
  }]
}
```

Coordinates are right-handed metres, +Y up and −Z forward. Rotation is a unit quaternion in **XYZW** order; scale is dimensionless. V1 objects have no parents, so transforms are relative to the scene root. IDs remain stable across saves.

Strict validation rejects unknown fields, duplicate object IDs, nonfinite numbers and malformed vectors. V1 permits at most 50 objects, position components within ±30 metres and scale components within 0.1–10. Asset identifiers and scene identity are UUIDs. The current database supports one canonical scene per project and enforces `sceneId == projectId`.

`GET/PUT /api/v1/projects/{projectId}/spatial-scene` return a snapshot with `projectId`, `sceneId`, `revision`, `document`, `updatedAt` and `canEdit`. PUT accepts `{expectedRevision, document}`. An unsaved authorized scene reads as revision 0 with no objects. Save revision is not the document's `version`; stale writes return a conflict while clients retain local changes.

The [repository](../../apps/web/src/server/db/spatial-scenes.ts) checks project roles and every referenced ready asset in the SQL write. Metadata contains asset IDs, never object-storage keys or arbitrary content URLs.

Three formats currently coexist intentionally: canonical quaternion scenes in `spatial_scenes`, legacy A-Frame Euler layouts in `xr_workspaces`, and session recording documents in `scene_state`. Pure Euler/quaternion helpers do not migrate or overwrite saved layouts. A shared project identity does not yet imply all renderers edit the same scene document.

Native viewing fits source geometry into a bounded volume. Its mapper reverses centering/normalization when saving canonical coordinates. The first native viewer rejects ambiguous multiple instances, unsupported nonuniform scale and out-of-volume restores rather than silently rewriting them.

Future hierarchy, object types, interaction metadata, environment settings and platform extensions require explicit v2 schemas and APIs. Installed Swift v1 decoders reject unknown properties. Follow [ADR 0002](../adr/0002-scene-version-compatibility.md); do not add the target prompt's example fields to v1 in place.
