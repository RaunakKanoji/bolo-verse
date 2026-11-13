import { z } from "zod";
import { AssetSummarySchema } from "./assets";

export const DeliverableRevisionSchema = z.strictObject({
  supersedesVersionId: z.uuid(),
  expectedVersion: z.int().positive().max(2_147_483_647),
  expectedDecisionId: z.uuid(),
});
export const PublishDeliverableSchema = z.strictObject({
  assetId: z.uuid(),
  title: z.string().trim().min(1).max(120),
  caption: z.string().trim().max(1000).optional(),
  briefVersion: z.int().positive().max(2_147_483_647).optional(),
  sceneRevision: z.int().positive().max(2_147_483_647).optional(),
  idempotencyKey: z.uuid(),
  revision: DeliverableRevisionSchema.optional(),
});
export type PublishDeliverable = z.infer<typeof PublishDeliverableSchema>;
const sourceFields = {
  schemaVersion: z.literal(2),
  sourceType: z.literal("uploaded_image"),
  projectId: z.uuid(),
  assetId: z.uuid(),
  checksumSha256: z.string().regex(/^[a-f0-9]{64}$/),
  briefVersion: z.int().positive().optional(),
  sceneRevision: z.int().positive().optional(),
  sceneRelation: z.literal("context_only").optional(),
  revision: DeliverableRevisionSchema.optional(),
};
const contextual = (value: { sceneRevision?: number; sceneRelation?: string }) =>
  (value.sceneRevision !== undefined) === (value.sceneRelation !== undefined);
/** Separate from legacy OutputSourceSnapshot v1; never a canonical render claim. */
export const UploadedImageProvenanceSchema = z
  .strictObject({
    ...sourceFields,
    creatorId: z.string().min(1).max(255),
    title: z.string().min(1).max(120),
    caption: z.string().max(1000),
  })
  .refine(contextual, "Scene links are contextual only.");
export type UploadedImageProvenance = z.infer<typeof UploadedImageProvenanceSchema>;
export const UploadedImageSourceSchema = z.strictObject(sourceFields).refine(contextual);
export const DeliverableSchema = z
  .strictObject({
    deliverableId: z.uuid(),
    projectId: z.uuid(),
    version: z.int().positive(),
    title: z.string().min(1).max(120),
    caption: z.string().max(1000),
    status: z.literal("published"),
    publishedAt: z.iso.datetime(),
    source: UploadedImageSourceSchema,
    asset: AssetSummarySchema,
  })
  .refine(
    (value) =>
      value.projectId === value.source.projectId &&
      value.projectId === value.asset.projectId &&
      value.source.assetId === value.asset.id &&
      value.asset.contentUrl === `/api/v1/assets/${value.asset.id}/content`,
    "Publication source identity must match.",
  );
export type Deliverable = z.infer<typeof DeliverableSchema>;
export const DeliverableResultSchema = z.strictObject({ deliverable: DeliverableSchema });
export const DeliverableListSchema = z.strictObject({
  deliverables: z.array(DeliverableSchema).max(50),
  hasMore: z.boolean(),
  canPublish: z.boolean(),
});
