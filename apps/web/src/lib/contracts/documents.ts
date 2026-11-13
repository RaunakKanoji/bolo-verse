import { z } from "zod";
import { LanguageSchema, ResourceIdSchema } from "./api";
import { BackgroundSchema, LightingPresetSchema } from "./commands";

const text = (max: number) => z.string().trim().min(1).max(max);
const seconds = z.number().finite().positive().max(600);
export const AspectRatioSchema = z.enum(["9:16", "1:1", "16:9"]);
export const BriefApprovalStatusSchema = z.enum(["proposed", "approved", "rejected"]);

export const BriefPayloadSchema = z.strictObject({
  schemaVersion: z.literal(1),
  objective: text(1000), audience: text(1000), product: text(300),
  format: z.enum(["reel", "poster", "script"]), aspectRatio: AspectRatioSchema,
  tone: text(300), language: LanguageSchema,
  facts: z.array(z.strictObject({ id: ResourceIdSchema, text: text(300) })).max(20),
  prohibitedClaims: z.array(text(300)).max(20),
  constraints: z.array(text(300)).max(20),
  // Additive authoring metadata; existing rich v1 brief documents remain valid.
  title: text(120).optional(),
  brandRequirements: z.string().trim().max(2000).optional(),
  keyMessage: z.string().trim().max(1000).optional(),
  channels: z.array(text(120)).max(20).optional(),
  references: z.array(z.url().max(2000).refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password;
    } catch { return false; }
  }, "Use HTTPS reference URLs without credentials.")).max(10).optional(),
  deadline: z.iso.date().optional(),
  notes: z.string().trim().max(5000).optional(),
});
export type BriefPayload = z.infer<typeof BriefPayloadSchema>;

export const DirectionPayloadSchema = z.strictObject({
  kind: z.literal("direction"), schemaVersion: z.literal(1), briefVersionId: ResourceIdSchema,
  title: text(120), hook: text(500), concept: text(2000), visualTreatment: text(1000),
  rationale: text(1000), constraints: z.array(text(300)).max(20),
});
export type DirectionPayload = z.infer<typeof DirectionPayloadSchema>;

export const ScriptPayloadSchema = z.strictObject({
  kind: z.literal("script"), schemaVersion: z.literal(1), briefVersionId: ResourceIdSchema,
  directionVersionId: ResourceIdSchema,
  sections: z.array(z.strictObject({
    id: ResourceIdSchema, spokenText: z.string().max(2000), onScreenText: z.string().max(500), durationSeconds: seconds,
  })).min(1).max(50),
  callToAction: z.string().max(500),
});
export type ScriptPayload = z.infer<typeof ScriptPayloadSchema>;

export const StoryboardPayloadSchema = z.strictObject({
  kind: z.literal("storyboard"), schemaVersion: z.literal(1), scriptVersionId: ResourceIdSchema,
  shots: z.array(z.strictObject({
    id: ResourceIdSchema, durationSeconds: seconds, framing: text(300), cameraMovement: text(300),
    description: text(1000), narration: z.string().max(2000), textOverlay: z.string().max(500),
    assetIds: z.array(ResourceIdSchema).max(20), lighting: text(300), shootingNotes: z.string().max(1000),
  })).min(1).max(50),
});
export type StoryboardPayload = z.infer<typeof StoryboardPayloadSchema>;

export const NotePayloadSchema = z.strictObject({
  kind: z.literal("note"), schemaVersion: z.literal(1), text: text(5000),
  linkedArtifactVersionId: ResourceIdSchema.optional(), shotId: ResourceIdSchema.optional(),
  timecodeSeconds: z.number().finite().nonnegative().optional(),
});
export type NotePayload = z.infer<typeof NotePayloadSchema>;

// Foundation document only: no timeline UI, edit execution or rendering in M0.
export const MediaEditDocumentSchema = z.strictObject({
  schemaVersion: z.literal(1), aspectRatio: AspectRatioSchema,
  clips: z.array(z.strictObject({
    id: ResourceIdSchema, assetId: ResourceIdSchema,
    startSeconds: z.number().finite().nonnegative(), durationSeconds: seconds,
    trimStartSeconds: z.number().finite().nonnegative(), audioLevel: z.number().finite().min(0).max(2),
  })).min(1).max(50),
  overlays: z.array(z.strictObject({
    id: ResourceIdSchema, kind: z.enum(["title", "caption"]), text: text(500),
    startSeconds: z.number().finite().nonnegative(), durationSeconds: seconds,
    style: z.strictObject({
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      fontSize: z.number().int().min(12).max(120), align: z.enum(["left", "center", "right"]),
    }),
  })).max(50),
});
export type MediaEditDocument = z.infer<typeof MediaEditDocumentSchema>;

export const ArtifactPayloadSchema = z.discriminatedUnion("kind", [
  DirectionPayloadSchema, ScriptPayloadSchema, StoryboardPayloadSchema, NotePayloadSchema,
  z.strictObject({ kind: z.literal("media_edit"), schemaVersion: z.literal(1), briefVersionId: ResourceIdSchema, document: MediaEditDocumentSchema }),
]);
export type ArtifactPayload = z.infer<typeof ArtifactPayloadSchema>;

const vector = z.strictObject({ x: z.number().finite(), y: z.number().finite(), z: z.number().finite() });
export const RecordingCameraSchema = z.strictObject({
  preset: z.enum(["static", "push-in", "orbit"]), position: vector, target: vector,
  fieldOfView: z.number().finite().min(10).max(100), aspectRatio: AspectRatioSchema,
});

export const SceneDocumentSchema = z.strictObject({
  schemaVersion: z.literal(1), background: BackgroundSchema,
  lighting: z.strictObject({ preset: LightingPresetSchema, brightness: z.number().finite().min(0.2).max(2) }),
  products: z.array(z.strictObject({
    productId: ResourceIdSchema, assetId: ResourceIdSchema,
    representation: z.enum(["photo-card", "cutout", "model-3d"]),
    position: vector, scale: z.number().finite().min(0.3).max(3), yawDegrees: z.number().finite(),
  })).max(20),
  selectedProductId: ResourceIdSchema.optional(),
  camera: RecordingCameraSchema,
  storyboardShotId: ResourceIdSchema.optional(),
});
export type SceneDocument = z.infer<typeof SceneDocumentSchema>;

const sourceLinks = {
  schemaVersion: z.literal(1), briefVersionId: ResourceIdSchema, briefApprovalStatus: BriefApprovalStatusSchema,
  scriptVersionId: ResourceIdSchema.optional(), storyboardVersionId: ResourceIdSchema.optional(),
  assetIds: z.array(ResourceIdSchema).max(100),
};
export const OutputSourceSnapshotSchema = z.discriminatedUnion("sourceKind", [
  z.strictObject({
    ...sourceLinks, sourceKind: z.literal("scene"), sessionId: ResourceIdSchema,
    sceneRevision: z.number().int().nonnegative(), scene: SceneDocumentSchema,
  }),
  z.strictObject({
    ...sourceLinks, sourceKind: z.literal("media_edit"), mediaEditVersionId: ResourceIdSchema, edit: MediaEditDocumentSchema,
  }),
]);
export type OutputSourceSnapshot = z.infer<typeof OutputSourceSnapshotSchema>;

export const OutputMetadataSchema = z.strictObject({
  format: z.enum(["reel", "poster", "script"]), mimeType: text(100), bytes: z.number().int().positive(),
  width: z.number().int().positive().optional(), height: z.number().int().positive().optional(),
  durationSeconds: seconds.optional(), measuredFramesPerSecond: z.number().finite().positive().optional(),
});
export type OutputMetadata = z.infer<typeof OutputMetadataSchema>;

export const ClaimIssueSchema = z.strictObject({
  claim: text(2000),
  transcriptSpan: z.strictObject({ start: z.number().int().nonnegative(), end: z.number().int().positive() })
    .refine(({ start, end }) => end > start, { message: "Transcript end must follow start" }),
  timeRange: z.strictObject({ startSeconds: z.number().finite().nonnegative(), endSeconds: z.number().finite().positive() })
    .refine(({ startSeconds, endSeconds }) => endSeconds > startSeconds, { message: "Time range end must follow start" }).optional(),
  verdict: z.enum(["supported", "contradicts", "prohibited", "unsupported", "needs_review"]),
  factIds: z.array(ResourceIdSchema).max(20), explanation: text(2000), suggestedRevision: text(2000).optional(),
});
// The check service must also validate offsets against the actual transcript and
// resolve these IDs against the selected approved brief, not arbitrary facts.
export type ClaimIssue = z.infer<typeof ClaimIssueSchema>;
