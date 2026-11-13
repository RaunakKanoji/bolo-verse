import { z } from "zod";
import { apiResultSchema, ResourceIdSchema } from "./api";
import {
  BriefPayloadSchema,
  DirectionPayloadSchema,
  ScriptPayloadSchema,
  StoryboardPayloadSchema,
  NotePayloadSchema,
} from "./documents";

// Browser-only authoring API: does not extend the separately versioned v1 wire contract.
export const ProductionPayloadSchema = z.discriminatedUnion("kind", [
  DirectionPayloadSchema,
  ScriptPayloadSchema,
  StoryboardPayloadSchema,
  NotePayloadSchema,
]);
export type ProductionPayload = z.infer<typeof ProductionPayloadSchema>;
export const SaveProductionArtifactSchema = z
  .strictObject({
    idempotencyKey: ResourceIdSchema,
    expectedVersion: z.int().min(0).max(2_147_483_646),
    artifact: ProductionPayloadSchema,
  })
  .refine(
    (input) => new TextEncoder().encode(JSON.stringify(input)).byteLength <= 32768,
    "Keep the artifact below 32 KiB.",
  );
export type SaveProductionArtifact = z.infer<typeof SaveProductionArtifactSchema>;
export const ProductionVersionSchema = z.strictObject({
  id: ResourceIdSchema,
  projectId: ResourceIdSchema,
  kind: z.enum(["direction", "script", "storyboard", "note"]),
  version: z.int().positive(),
  artifact: ProductionPayloadSchema,
  savedAt: z.iso.datetime(),
});
export type ProductionVersion = z.infer<typeof ProductionVersionSchema>;
export const ProductionLibrarySchema = z.strictObject({
  versions: z.array(ProductionVersionSchema).max(200),
  briefs: z
    .array(
      z.strictObject({
        id: ResourceIdSchema,
        version: z.int().positive(),
        brief: BriefPayloadSchema,
      }),
    )
    .max(200),
  ideas: z
    .array(
      z.strictObject({
        id: ResourceIdSchema,
        title: z.string().max(120),
        description: z.string().max(4000),
      }),
    )
    .max(100),
  generation: z.literal("unavailable"),
});
export type ProductionLibrary = z.infer<typeof ProductionLibrarySchema>;
export const ProductionLibraryResponseSchema = apiResultSchema(ProductionLibrarySchema);
export const ProductionSaveResponseSchema = apiResultSchema(ProductionVersionSchema);
