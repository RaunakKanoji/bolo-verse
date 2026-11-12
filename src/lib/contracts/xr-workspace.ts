import { z } from "zod";

const vector = (min: number, max: number) => z.tuple([
  z.number().finite().min(min).max(max),
  z.number().finite().min(min).max(max),
  z.number().finite().min(min).max(max),
]);
export const XRTransformSchema = z.strictObject({
  position: vector(-30, 30), rotation: vector(-360, 360), scale: vector(0.1, 10),
});
export type XRTransform = z.infer<typeof XRTransformSchema>;

export const XRSpatialObjectSchema = z.strictObject({
  id: z.string().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/),
  type: z.enum(["panel", "asset", "model"]),
  assetId: z.uuid().optional(),
  transform: XRTransformSchema,
}).refine((object) => object.type === "panel" ? object.assetId === undefined : object.assetId !== undefined, {
  message: "Asset and model objects require an asset ID; panels cannot contain one.",
});
export type XRSpatialObject = z.infer<typeof XRSpatialObjectSchema>;

export const XRLayoutSchema = z.strictObject({
  schemaVersion: z.literal(1),
  environment: z.literal("creative-studio"),
  objects: z.array(XRSpatialObjectSchema).min(1).max(50),
}).refine(({ objects }) => new Set(objects.map(({ id }) => id)).size === objects.length, "Object IDs must be unique.");
export type XRLayout = z.infer<typeof XRLayoutSchema>;

export const XRWorkspaceSnapshotSchema = z.strictObject({
  id: z.uuid().nullable(), projectId: z.uuid(), version: z.number().int().min(0).max(2_147_483_646),
  layout: XRLayoutSchema, updatedAt: z.iso.datetime().nullable(),
});
export type XRWorkspaceSnapshot = z.infer<typeof XRWorkspaceSnapshotSchema>;

export const XRProjectContentSchema = z.strictObject({
  brief: z.strictObject({ id: z.uuid(), title: z.string().max(350), body: z.string().max(6000), status: z.enum(["proposed", "approved", "rejected"]) }).nullable(),
  artifacts: z.array(z.strictObject({
    id: z.uuid(), kind: z.enum(["direction", "script", "storyboard", "note", "media_edit"]),
    title: z.string().max(160), body: z.string().max(6000),
  })).max(5),
  assets: z.array(z.strictObject({
    id: z.uuid(), mimeType: z.string().min(1).max(150), byteSize: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    width: z.number().int().positive().nullable(), height: z.number().int().positive().nullable(),
    durationSeconds: z.number().finite().nonnegative().nullable(),
  })).max(40),
  reviews: z.array(z.strictObject({
    id: z.uuid(), kind: z.enum(["comment", "decision"]), body: z.string().max(6000),
    decision: z.enum(["approved", "changes_requested"]).nullable(),
    contentVersionId: z.uuid(), createdAt: z.iso.datetime(),
  })).max(10),
});
export type XRProjectContent = z.infer<typeof XRProjectContentSchema>;

export const XRWorkspaceDataSchema = z.strictObject({
  workspace: XRWorkspaceSnapshotSchema,
  canEdit: z.boolean(),
  project: z.strictObject({ id: z.uuid(), name: z.string().min(1).max(120), objective: z.string().min(1).max(2000) }),
  content: XRProjectContentSchema,
});
export type XRWorkspaceData = z.infer<typeof XRWorkspaceDataSchema>;
export const SaveXRWorkspaceSchema = z.strictObject({ expectedVersion: z.number().int().min(0).max(2_147_483_645), layout: XRLayoutSchema });
export const ResetXRWorkspaceSchema = z.strictObject({ expectedVersion: z.number().int().min(0).max(2_147_483_645) });

/** Content IDs are canonical; text/credentials/URLs never live in a layout. */
export function createDefaultXRLayout(content: XRProjectContent): XRLayout {
  const identifiers: Omit<XRSpatialObject, "transform">[] = [{ id: "project-overview", type: "panel" }];
  if (content.brief) identifiers.push({ id: `brief-${content.brief.id}`, type: "panel" });
  for (const artifact of content.artifacts) identifiers.push({ id: `artifact-${artifact.id}`, type: "panel" });
  if (content.reviews.length) identifiers.push({ id: "client-review", type: "panel" });
  for (const asset of content.assets) identifiers.push({
    id: `asset-${asset.id}`, assetId: asset.id,
    type: ["model/gltf-binary", "model/gltf+json"].includes(asset.mimeType) ? "model" : "asset",
  });
  return XRLayoutSchema.parse({ schemaVersion: 1, environment: "creative-studio", objects: identifiers.map((object, index) => ({
    ...object,
    transform: index === 0
      ? { position: [0, 2.3, -3.7], rotation: [0, 0, 0], scale: [1.2, 1.2, 1.2] }
      : { position: [((index - 1) % 3 - 1) * 2.3, 1.3, -3.2 - Math.floor((index - 1) / 3) * 1.6], rotation: [0, 0, 0], scale: [0.85, 0.85, 0.85] },
  })) });
}
