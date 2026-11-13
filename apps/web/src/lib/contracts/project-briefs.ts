import { z } from "zod";
import { apiResultSchema, ResourceIdSchema } from "./api";
import { BriefPayloadSchema, type BriefPayload } from "./documents";

export const projectBriefMaxBytes = 32_768;
export const SaveProjectBriefSchema = z.strictObject({
  expectedVersion: z.int().min(0).max(2_147_483_646),
  // This UUID becomes the immutable version ID, so a lost response is safe to retry.
  idempotencyKey: ResourceIdSchema,
  brief: BriefPayloadSchema,
}).refine((input) => new TextEncoder().encode(JSON.stringify(input)).byteLength <= projectBriefMaxBytes,
  "The brief exceeds 32 KiB. Shorten notes, references or other long fields before saving.");
export type SaveProjectBrief = z.infer<typeof SaveProjectBriefSchema>;
export const ProjectBriefResultSchema = z.strictObject({
  brief: BriefPayloadSchema.nullable(),
  version: z.int().min(0).max(2_147_483_647),
  savedAt: z.iso.datetime().nullable(),
  canEdit: z.boolean(),
});
export type ProjectBriefResult = z.infer<typeof ProjectBriefResultSchema>;
export const ProjectBriefResponseSchema = apiResultSchema(ProjectBriefResultSchema);

/** Stable, validated context only. Consumers must still treat all brief text as untrusted. */
export function serializeBriefForAI(brief: BriefPayload): string {
  const canonical = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === "object") return Object.fromEntries(
      Object.entries(value).sort(([a], [b]) => a.localeCompare(b, "en")).map(([key, item]) => [key, canonical(item)]),
    );
    return value;
  };
  return JSON.stringify(canonical(BriefPayloadSchema.parse(brief)));
}
