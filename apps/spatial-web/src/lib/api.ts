import { z } from "zod";
import {
  SaveSpatialSceneSchema,
  SpatialSceneResultSchema,
  type SaveSpatialScene,
} from "@shape/scene-schema";
import {
  createShapeClient,
  ShapeApiError,
} from "../../../../packages/api-contract/generated/client";
import type {
  AssetSummary,
  ProjectSummary,
} from "../../../../packages/api-contract/generated/models";
import { validateSnapshot } from "../editor/state";

export { ShapeApiError };
const projectSchema = z.strictObject({
  id: z.uuid(),
  name: z.string().min(1).max(120),
  objective: z.string().min(1).max(2000),
  sample: z.boolean(),
  createdAt: z.iso.datetime(),
});
const assetSchema = z.strictObject({
  id: z.uuid(),
  projectId: z.uuid(),
  mimeType: z.string().min(1).max(160),
  byteSize: z.int().min(0).max(Number.MAX_SAFE_INTEGER),
  width: z.int().positive().nullable(),
  height: z.int().positive().nullable(),
  durationSeconds: z.number().finite().nonnegative().nullable(),
  createdAt: z.iso.datetime(),
  contentUrl: z
    .string()
    .regex(/^\/api\/v1\/assets\/[0-9a-f-]{36}\/content$/)
    .nullable(),
  nativeContentUrl: z
    .string()
    .regex(/^\/api\/v1\/assets\/[0-9a-f-]{36}\/native-content$/)
    .nullable(),
});
const envelope = <T extends z.ZodType>(data: T) =>
  z.strictObject({ ok: z.literal(true), data, requestId: z.string().min(1).max(100) });
const projectResponse = envelope(z.strictObject({ project: projectSchema }));
const assetResponse = envelope(
  z.strictObject({ assets: z.array(assetSchema).max(100), hasMore: z.boolean() }),
);
const sceneResponse = envelope(SpatialSceneResultSchema);
function parseAssets(projectId: string, input: unknown) {
  const result = assetResponse.parse(input).data;
  if (
    result.assets.some(
      (asset) =>
        asset.projectId !== projectId ||
        (asset.contentUrl !== null && asset.contentUrl !== `/api/v1/assets/${asset.id}/content`),
    )
  )
    throw new Error("Project assets did not match.");
  return result;
}
export type WorkspaceBootstrap = {
  project: ProjectSummary;
  assets: AssetSummary[];
  hasMoreAssets: boolean;
  snapshot: ReturnType<typeof validateSnapshot>;
};

export function parseBootstrap(
  projectId: string,
  projectInput: unknown,
  assetsInput: unknown,
  sceneInput: unknown,
): WorkspaceBootstrap {
  const { project } = projectResponse.parse(projectInput).data;
  const { assets, hasMore } = parseAssets(projectId, assetsInput);
  const snapshot = validateSnapshot(sceneResponse.parse(sceneInput).data.scene, projectId);
  if (project.id !== projectId) throw new Error("Project data did not match.");
  return { project, assets, hasMoreAssets: hasMore, snapshot };
}

export function assetPreviewKind(asset: AssetSummary): "image" | "model" | null {
  if (
    !asset.contentUrl ||
    asset.contentUrl !== `/api/v1/assets/${asset.id}/content` ||
    asset.byteSize <= 0 ||
    asset.byteSize > 20 * 1024 * 1024
  )
    return null;
  if (asset.mimeType === "model/gltf-binary") return "model";
  if (
    ["image/png", "image/jpeg", "image/webp", "image/gif"].includes(asset.mimeType) &&
    asset.width &&
    asset.height &&
    asset.width * asset.height <= 16_777_216
  )
    return "image";
  return null;
}

export function createSpatialApi(fetcher: typeof fetch = fetch) {
  const client = createShapeClient((path, init) =>
    fetcher(path, { ...init, cache: "no-store", redirect: "error" }),
  );
  return {
    async listAssets(projectId: string, signal?: AbortSignal) {
      z.uuid().parse(projectId);
      const response = await client.listProjectAssets(projectId, signal);
      signal?.throwIfAborted();
      return parseAssets(projectId, response);
    },
    async bootstrap(projectId: string, signal?: AbortSignal): Promise<WorkspaceBootstrap> {
      z.uuid().parse(projectId);
      const [project, assets, scene] = await Promise.all([
        client.getProject(projectId, signal),
        client.listProjectAssets(projectId, signal),
        client.getSpatialScene(projectId, signal),
      ]);
      signal?.throwIfAborted();
      return parseBootstrap(projectId, project, assets, scene);
    },
    async load(projectId: string, signal?: AbortSignal) {
      z.uuid().parse(projectId);
      return validateSnapshot(
        sceneResponse.parse(await client.getSpatialScene(projectId, signal)).data.scene,
        projectId,
      );
    },
    async save(projectId: string, input: SaveSpatialScene, signal?: AbortSignal) {
      z.uuid().parse(projectId);
      const body = SaveSpatialSceneSchema.parse(input);
      if (body.document.sceneId !== projectId)
        throw new Error("Scene does not belong to this project.");
      return validateSnapshot(
        sceneResponse.parse(await client.saveSpatialScene(projectId, body, signal)).data.scene,
        projectId,
      );
    },
  };
}
