import { z } from "zod";
import { ResourceIdSchema } from "./api";
import { AssetSummarySchema } from "./assets";
import { MediaEditDocumentSchema } from "./documents";

export const videoEditorMaxBytes = 128 * 1024;
export const videoEditorSourceMaxBytes = 20 * 1024 * 1024;
export const VideoEditorDocumentSchema = MediaEditDocumentSchema.superRefine(
  (document, context) => {
    const ids = new Set<string>();
    for (const item of [...document.clips, ...document.overlays]) {
      if (ids.has(item.id))
        context.addIssue({ code: "custom", message: "Clip and overlay IDs must be unique." });
      ids.add(item.id);
      if (item.startSeconds + item.durationSeconds > 60)
        context.addIssue({ code: "custom", message: "The timeline is limited to 60 seconds." });
    }
    for (const clip of document.clips)
      if (clip.audioLevel > 1)
        context.addIssue({ code: "custom", message: "Video volume must be between zero and one." });
    for (const clip of document.clips)
      if (clip.trimStartSeconds + clip.durationSeconds > 600)
        context.addIssue({ code: "custom", message: "Source trims are limited to 600 seconds." });
    const ordered = [...document.clips].sort((a, b) => a.startSeconds - b.startSeconds);
    for (let i = 1; i < ordered.length; i++)
      if (ordered[i].startSeconds < ordered[i - 1].startSeconds + ordered[i - 1].durationSeconds)
        context.addIssue({ code: "custom", message: "Source clips must not overlap." });
  },
);
export const VideoEditorCapabilitiesSchema = z.strictObject({
  availability: z.enum(["configured", "unconfigured", "disabled"]),
  reason: z.string().max(500).nullable(),
  environment: z.enum(["sandbox", "production"]).nullable(),
  maxDurationSeconds: z.literal(60),
  maxClips: z.literal(50),
  outputMimeType: z.literal("video/mp4"),
});
export const VideoEditorDraftSchema = z.strictObject({
  projectId: ResourceIdSchema,
  revision: z.int().nonnegative(),
  document: VideoEditorDocumentSchema.nullable(),
  updatedAt: z.iso.datetime().nullable(),
  canEdit: z.boolean(),
});
export const VideoEditorResultSchema = z.strictObject({
  draft: VideoEditorDraftSchema,
  capabilities: VideoEditorCapabilitiesSchema,
});
export const SaveVideoEditorDraftSchema = z.strictObject({
  expectedRevision: z.int().min(0).max(2147483646),
  document: VideoEditorDocumentSchema,
});
export const CreateVideoRenderSchema = z.strictObject({
  idempotencyKey: ResourceIdSchema,
  draftRevision: z.int().positive().max(2147483647),
  consent: z.literal("shotstack-render-v1"),
});
export const VideoRenderJobSchema = z.strictObject({
  id: ResourceIdSchema,
  projectId: ResourceIdSchema,
  draftRevision: z.int().positive(),
  status: z.enum(["queued", "processing", "ready", "failed", "cancelled"]),
  environment: z.enum(["sandbox", "production"]),
  failureCode: z.string().max(80).nullable(),
  errorMessage: z.string().max(500).nullable(),
  outputAsset: AssetSummarySchema.nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export const VideoRenderResultSchema = z.strictObject({ job: VideoRenderJobSchema });
export const VideoRenderListSchema = z.strictObject({
  jobs: z.array(VideoRenderJobSchema).max(50),
});
export type VideoEditorDocument = z.infer<typeof VideoEditorDocumentSchema>;
export type VideoEditorCapabilities = z.infer<typeof VideoEditorCapabilitiesSchema>;
export type VideoEditorDraft = z.infer<typeof VideoEditorDraftSchema>;
export type SaveVideoEditorDraft = z.infer<typeof SaveVideoEditorDraftSchema>;
export type CreateVideoRender = z.infer<typeof CreateVideoRenderSchema>;
export type VideoRenderJob = z.infer<typeof VideoRenderJobSchema>;
