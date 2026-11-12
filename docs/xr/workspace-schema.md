# Workspace schema and API

The shared source of truth is `src/lib/contracts/xr-workspace.ts`. The fourth migration, `drizzle/0003_xr_workspaces.sql`, adds one `xr_workspaces` row per project, containing an ID, project foreign key, positive version, JSONB layout and creation/update timestamps. Ownership is inherited through the project and its membership rules; the browser cannot supply an owner.

## Snapshot

```ts
type WorkspaceSnapshot = {
  id: string | null;
  projectId: string;
  version: number;
  layout: {
    schemaVersion: 1;
    environment: "creative-studio";
    objects: Array<{
      id: string;
      type: "panel" | "asset" | "model";
      assetId?: string;
      transform: {
        position: [number, number, number];
        rotation: [number, number, number];
        scale: [number, number, number];
      };
    }>;
  };
  updatedAt: string | null;
};
```

Strict Zod contracts reject extra properties, duplicate object IDs, nonfinite/out-of-bounds transforms and layouts outside 1–50 objects. Asset/model objects require an asset UUID; panel objects cannot contain one. Canonical IDs include `project-overview`, `brief-<UUID>`, `artifact-<UUID>`, `asset-<UUID>` and `client-review` when actual reviews exist. The server verifies references and types against the project's real catalog. Layouts contain no HTML, media bytes, object keys or signed URLs.

## Endpoints

All endpoints require a verified Clerk subject and server-side project authorization. Responses use the existing `{ok, data, requestId}` or `{ok:false, error, requestId}` envelope and private/no-store behavior.

| Endpoint                                   | Input                       | Successful data                          |
| ------------------------------------------ | --------------------------- | ---------------------------------------- |
| `GET /api/xr/workspaces/:projectId`        | Project UUID                | `{workspace, canEdit, project, content}` |
| `PUT /api/xr/workspaces/:projectId`        | `{expectedVersion, layout}` | `{workspace}`                            |
| `POST /api/xr/workspaces/:projectId/reset` | `{expectedVersion}`         | `{workspace}`                            |

Mutations also require an allowed request origin and bounded JSON. Owners, creators and editors may write; assigned clients may read. The catalog contains one brief, up to five artifact kinds, forty ready assets and ten review entries. Text summaries are bounded. Asset metadata excludes storage credentials and object keys.

## Versions and reset

A project without a stored layout reads as `id:null`, `version:0`, `updatedAt:null` with a generated default layout. A read does not create a database row. The first write atomically inserts version 1; a concurrent first write conflicts. Later writes match the expected version and increment it in the same SQL update. Membership and asset readiness are checked in the write statement, as well as during validation.

A stale expected version returns **409 CONFLICT**; it does not overwrite the newer layout. This is compare-and-swap concurrency, not a collaboration merge or an idempotency-key protocol. The browser retains its unsaved changes after a failed save.

Saved brief/artifact references remain intentional references when newer revisions arrive. Reset rebuilds the default from the latest authorized catalog and saves it at the next version, then the client reloads that catalog. Reset replaces saved arrangement/reference choices; it does not delete the project, assets, artifacts or review history. The old session `scene_state` schema and immutable artifact versions remain separate.
