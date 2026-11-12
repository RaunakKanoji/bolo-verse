import { z } from "zod";
import { AssetSummarySchema } from "./assets";

export const imageCreationMaxBytes = 20 * 1024 * 1024;
// Leave room for base64 and prompt overhead inside conservative inline-provider limits.
export const imageGenerationReferenceMaxBytes = 10 * 1024 * 1024;
export const imageCreationPromptLimit = 4000;
export const CreationImageMimeSchema = z.enum(["image/png", "image/jpeg", "image/webp"]);
export const ImageAspectRatioSchema = z.enum(["1:1", "16:9", "4:5", "9:16"]);
export const ImageModelIdSchema = z.enum(["gemini-3.1-flash-image", "gemini-3-pro-image", "gemini-2.5-flash-image"]);
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const timestamp = z.iso.datetime();

export const CreateImageUploadSchema = z.strictObject({
  projectId: z.uuid(), idempotencyKey: z.uuid(),
  fileName: z.string().trim().min(1).max(180).regex(/^[^\u0000-\u001f\u007f/\\]+$/),
  mimeType: CreationImageMimeSchema, byteSize: z.int().positive().max(imageCreationMaxBytes), checksumSha256: hash,
});
export const FinalizeImageUploadSchema = z.strictObject({});
export const ImageUploadSessionSchema = z.strictObject({
  id: z.uuid(), projectId: z.uuid(), assetId: z.uuid(), expiresAt: timestamp,
  uploadUrl: z.url({ protocol: /^https$/ }), uploadContentType: CreationImageMimeSchema,
});
export const ImageUploadResultSchema = z.strictObject({ upload: ImageUploadSessionSchema });
export const FinalizedImageUploadResultSchema = z.strictObject({ asset: AssetSummarySchema });

export const ImageGenerationCapabilitiesSchema = z.strictObject({
  availability: z.enum(["configured", "unconfigured"]), reason: z.string().min(1).max(500),
  models: z.array(z.strictObject({
    id: ImageModelIdSchema, label: z.string().min(1).max(80), aspectRatios: z.array(ImageAspectRatioSchema).min(1).max(4), referenceImage: z.boolean(),
  })).max(3),
  maxReferenceBytes: z.int().positive().max(imageCreationMaxBytes), maxPromptCharacters: z.int().positive().max(imageCreationPromptLimit),
});
export const CreateImageGenerationSchema = z.strictObject({
  projectId: z.uuid(), idempotencyKey: z.uuid(), prompt: z.string().trim().min(1).max(imageCreationPromptLimit),
  modelId: ImageModelIdSchema, aspectRatio: ImageAspectRatioSchema, referenceAssetId: z.uuid().nullable(),
});
export const CancelImageGenerationSchema = z.strictObject({});
export const ImageGenerationJobSchema = z.strictObject({
  id: z.uuid(), projectId: z.uuid(), status: z.enum(["queued", "processing", "ready", "failed", "cancelled"]),
  prompt: z.string().min(1).max(imageCreationPromptLimit), modelId: ImageModelIdSchema, aspectRatio: ImageAspectRatioSchema,
  referenceAssetId: z.uuid().nullable(), outputAssetId: z.uuid().nullable(),
  errorCode: z.string().max(80).nullable(), errorMessage: z.string().max(500).nullable(),
  createdAt: timestamp, updatedAt: timestamp,
});
export const ImageGenerationResultSchema = z.strictObject({ job: ImageGenerationJobSchema });
export const ImageGenerationListSchema = z.strictObject({ jobs: z.array(ImageGenerationJobSchema).max(50) });
export type CreateImageUpload = z.infer<typeof CreateImageUploadSchema>;
export type ImageUploadSession = z.infer<typeof ImageUploadSessionSchema>;
export type CreateImageGeneration = z.infer<typeof CreateImageGenerationSchema>;
export type ImageGenerationJob = z.infer<typeof ImageGenerationJobSchema>;
export type ImageGenerationCapabilities = z.infer<typeof ImageGenerationCapabilitiesSchema>;
export type CreationImageMime = z.infer<typeof CreationImageMimeSchema>;
