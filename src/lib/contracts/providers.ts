import { z } from "zod";
import { ApiErrorSchema, RequestIdSchema, ResourceIdSchema } from "./api";
import { AspectRatioSchema, MediaEditDocumentSchema } from "./documents";

export const ProviderIdSchema = z.enum(["clerk", "database", "sarvam-stt", "sarvam-tts", "gemini", "r2", "shotstack"]);
export type ProviderId = z.infer<typeof ProviderIdSchema>;
export const ProviderReadinessSchema = z.strictObject({
  id: ProviderIdSchema, label: z.string().min(1).max(100),
  status: z.enum(["unconfigured", "configured-unverified", "ready", "error", "demo"]),
  enabled: z.boolean(), missing: z.array(z.string().min(1).max(100)),
});
export type ProviderReadiness = z.infer<typeof ProviderReadinessSchema>;

export const EditorCapabilitiesSchema = z.strictObject({
  operations: z.array(z.enum(["trim_clip", "set_title", "set_caption", "set_audio_level"])),
  aspectRatios: z.array(AspectRatioSchema),
  outputMimeTypes: z.array(z.enum(["video/mp4", "video/webm"])), canCancel: z.boolean(),
});
export type EditorCapabilities = z.infer<typeof EditorCapabilitiesSchema>;

export const ValidationResultSchema = z.discriminatedUnion("valid", [
  z.strictObject({ valid: z.literal(true) }),
  z.strictObject({ valid: z.literal(false), issues: z.array(z.strictObject({ path: z.string().max(300), message: z.string().min(1).max(1000) })).min(1) }),
]);
export type ValidationResult = z.infer<typeof ValidationResultSchema>;

export const RenderInputSchema = z.strictObject({
  projectId: ResourceIdSchema, mediaEditVersionId: ResourceIdSchema,
  idempotencyKey: RequestIdSchema, edit: MediaEditDocumentSchema,
});
export type RenderInput = z.infer<typeof RenderInputSchema>;
export const RenderJobReferenceSchema = z.strictObject({ provider: z.literal("shotstack"), jobId: z.string().min(1).max(256) });
export type RenderJobReference = z.infer<typeof RenderJobReferenceSchema>;
export const ProviderOutputSchema = z.strictObject({
  providerAssetId: z.string().min(1).max(256),
  // Provider-returned only. An importer must verify allowed origins, ownership,
  // actual bytes and size before private storage; this schema is not fetch authority.
  url: z.url({ protocol: /^https$/ }), mimeType: z.enum(["video/mp4", "video/webm"]),
  bytes: z.number().int().positive().optional(),
});
export type ProviderOutput = z.infer<typeof ProviderOutputSchema>;
export const RenderJobStatusSchema = z.discriminatedUnion("status", [
  z.strictObject({ status: z.literal("queued") }),
  z.strictObject({ status: z.literal("processing") }),
  z.strictObject({ status: z.literal("ready"), output: ProviderOutputSchema }),
  z.strictObject({ status: z.literal("failed"), error: ApiErrorSchema }),
  z.strictObject({ status: z.literal("cancelled") }),
]);
export type RenderJobStatus = z.infer<typeof RenderJobStatusSchema>;
export const CancelResultSchema = z.strictObject({ cancelled: z.boolean() });
export type CancelResult = z.infer<typeof CancelResultSchema>;
