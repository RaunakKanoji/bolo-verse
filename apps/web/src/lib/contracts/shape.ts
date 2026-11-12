import { CreateImageUploadSchema, FinalizeImageUploadSchema, ImageUploadSessionSchema, ImageUploadResultSchema, FinalizedImageUploadResultSchema, ImageGenerationCapabilitiesSchema, CreateImageGenerationSchema, CancelImageGenerationSchema, ImageGenerationJobSchema, ImageGenerationResultSchema, ImageGenerationListSchema } from "./creation";
import { AssetSummarySchema } from "./assets";
export { AssetSummarySchema, type AssetSummary } from "./assets";
import { z } from "zod";
import { ApiErrorSchema, RequestIdSchema, ResourceIdSchema } from "./api";
import { CreateProjectSchema, UpdateProjectSchema } from "./projects";
import { CanonicalSpatialObjectSchema, CanonicalSpatialSceneSchema, SpatialSceneSnapshotSchema, SpatialSceneResultSchema, SaveSpatialSceneSchema } from "./spatial-scene";

export const creativePromptLimit = 2000;
export const CreativeModeSchema = z.enum(["image", "video", "audio", "model3d"]);
export type CreativeMode = z.infer<typeof CreativeModeSchema>;
const prompt = z.string().max(creativePromptLimit);
export const CreativeDraftDocumentSchema = z.strictObject({
  schemaVersion: z.literal(1),
  mode: CreativeModeSchema,
  prompts: z.strictObject({ image: prompt, video: prompt, audio: prompt, model3d: prompt }),
});
export type CreativeDraftDocument = z.infer<typeof CreativeDraftDocumentSchema>;

export function createEmptyCreativeDraftDocument(): CreativeDraftDocument {
  return { schemaVersion: 1, mode: "image", prompts: { image: "", video: "", audio: "", model3d: "" } };
}

export const CreativeDraftSnapshotSchema = z.strictObject({
  projectId: ResourceIdSchema,
  revision: z.int().min(0).max(2_147_483_647),
  document: CreativeDraftDocumentSchema,
  updatedAt: z.iso.datetime().nullable(),
  canEdit: z.boolean(),
});
export type CreativeDraftSnapshot = z.infer<typeof CreativeDraftSnapshotSchema>;
export const SaveCreativeDraftSchema = z.strictObject({
  expectedRevision: z.int().min(0).max(2_147_483_646),
  document: CreativeDraftDocumentSchema,
});
export type SaveCreativeDraft = z.infer<typeof SaveCreativeDraftSchema>;
export const CreativeDraftResultSchema = z.strictObject({ draft: CreativeDraftSnapshotSchema });

export const CreativeCapabilitiesSchema = z.strictObject({
  schemaVersion: z.literal(1),
  modes: z.array(z.strictObject({
    id: CreativeModeSchema,
    label: z.string().min(1).max(40),
    availability: z.literal("not_implemented"),
    reason: z.string().min(1).max(400),
    // No options are advertised until the complete provider/job/storage path exists.
    settings: z.array(z.string()).max(0),
  })).length(4),
});
export type CreativeCapabilities = z.infer<typeof CreativeCapabilitiesSchema>;

export const ProjectSummarySchema = z.strictObject({
  id: ResourceIdSchema,
  name: z.string().min(1).max(120),
  objective: z.string().min(1).max(2000),
  sample: z.boolean(),
  createdAt: z.iso.datetime(),
});
export type ProjectSummary = z.infer<typeof ProjectSummarySchema>;
export const ProjectListSchema = z.strictObject({ projects: z.array(ProjectSummarySchema) });
export const ProjectDetailSchema = z.strictObject({ project: ProjectSummarySchema });
export const AssetListSchema = z.strictObject({ assets: z.array(AssetSummarySchema).max(100), hasMore: z.boolean() });

function successEnvelope<T extends z.ZodType>(data: T) {
  return z.strictObject({ ok: z.literal(true), data, requestId: RequestIdSchema });
}
export const ProjectListResponseSchema = successEnvelope(ProjectListSchema);
export const ProjectDetailResponseSchema = successEnvelope(ProjectDetailSchema);
export const AssetListResponseSchema = successEnvelope(AssetListSchema);
export const CreativeDraftResponseSchema = successEnvelope(CreativeDraftResultSchema);
export const CreativeCapabilitiesResponseSchema = successEnvelope(CreativeCapabilitiesSchema);
export const SpatialSceneResponseSchema = successEnvelope(SpatialSceneResultSchema);
export const ImageUploadResponseSchema = successEnvelope(ImageUploadResultSchema);
export const FinalizedImageUploadResponseSchema = successEnvelope(FinalizedImageUploadResultSchema);
export const ImageGenerationCapabilitiesResponseSchema = successEnvelope(ImageGenerationCapabilitiesSchema);
export const ImageGenerationResponseSchema = successEnvelope(ImageGenerationResultSchema);
export const ImageGenerationListResponseSchema = successEnvelope(ImageGenerationListSchema);
export const ShapeErrorResponseSchema = z.strictObject({ ok: z.literal(false), error: ApiErrorSchema, requestId: RequestIdSchema });

/** Source registry for the language-neutral OpenAPI artifact and generated clients. */
export const ShapeApiSchemas = {
  CreateImageUpload: CreateImageUploadSchema,
  FinalizeImageUpload: FinalizeImageUploadSchema,
  ImageUploadSession: ImageUploadSessionSchema,
  ImageUploadResult: ImageUploadResultSchema,
  FinalizedImageUploadResult: FinalizedImageUploadResultSchema,
  ImageGenerationCapabilities: ImageGenerationCapabilitiesSchema,
  CreateImageGeneration: CreateImageGenerationSchema,
  CancelImageGeneration: CancelImageGenerationSchema,
  ImageGenerationJob: ImageGenerationJobSchema,
  ImageGenerationResult: ImageGenerationResultSchema,
  ImageGenerationList: ImageGenerationListSchema,
  ImageUploadResponse: ImageUploadResponseSchema,
  FinalizedImageUploadResponse: FinalizedImageUploadResponseSchema,
  ImageGenerationCapabilitiesResponse: ImageGenerationCapabilitiesResponseSchema,
  ImageGenerationResponse: ImageGenerationResponseSchema,
  ImageGenerationListResponse: ImageGenerationListResponseSchema,
  CanonicalSpatialObject: CanonicalSpatialObjectSchema,
  CanonicalSpatialScene: CanonicalSpatialSceneSchema,
  SpatialSceneSnapshot: SpatialSceneSnapshotSchema,
  SpatialSceneResult: SpatialSceneResultSchema,
  SaveSpatialScene: SaveSpatialSceneSchema,
  SpatialSceneResponse: SpatialSceneResponseSchema,
  CreativeMode: CreativeModeSchema,
  CreativeDraftDocument: CreativeDraftDocumentSchema,
  CreativeDraftSnapshot: CreativeDraftSnapshotSchema,
  SaveCreativeDraft: SaveCreativeDraftSchema,
  CreativeDraftResult: CreativeDraftResultSchema,
  CreativeCapabilities: CreativeCapabilitiesSchema,
  ProjectSummary: ProjectSummarySchema,
  ProjectList: ProjectListSchema,
  ProjectDetail: ProjectDetailSchema,
  CreateProject: CreateProjectSchema,
  // JSON Schema cannot infer Zod's nonempty-object refinement automatically.
  UpdateProject: UpdateProjectSchema.meta({ minProperties: 1 }),
  AssetSummary: AssetSummarySchema,
  AssetList: AssetListSchema,
  ApiError: ApiErrorSchema,
  ErrorResponse: ShapeErrorResponseSchema,
  ProjectListResponse: ProjectListResponseSchema,
  ProjectDetailResponse: ProjectDetailResponseSchema,
  AssetListResponse: AssetListResponseSchema,
  CreativeDraftResponse: CreativeDraftResponseSchema,
  CreativeCapabilitiesResponse: CreativeCapabilitiesResponseSchema,
} as const;

export const ShapeApiOperations = [
  { operationId: "getImageGenerationCapabilities", method: "get", path: "/api/v1/creation/capabilities", responseSchema: "ImageGenerationCapabilitiesResponse", summary: "Read configured image generation capabilities (not live verification)", security: "public" },
  { operationId: "createImageUpload", method: "post", path: "/api/v1/assets/upload-session", responseSchema: "ImageUploadResponse", requestSchema: "CreateImageUpload", summary: "Reserve a private bounded image upload", security: "session", successStatus: 201 },
  { operationId: "finalizeImageUpload", method: "post", path: "/api/v1/assets/upload-session/{uploadId}/finalize", responseSchema: "FinalizedImageUploadResponse", requestSchema: "FinalizeImageUpload", summary: "Validate and publish an immutable private image", security: "session", pathParameters: ["uploadId"] },
  { operationId: "createImageGeneration", method: "post", path: "/api/v1/generations", responseSchema: "ImageGenerationResponse", requestSchema: "CreateImageGeneration", summary: "Queue an idempotent private image generation", security: "session", successStatus: 202 },
  { operationId: "listImageGenerations", method: "get", path: "/api/v1/projects/{projectId}/generations", responseSchema: "ImageGenerationListResponse", summary: "Read your latest 50 private project image jobs", security: "session", pathParameters: ["projectId"] },
  { operationId: "getImageGeneration", method: "get", path: "/api/v1/generations/{jobId}", responseSchema: "ImageGenerationResponse", summary: "Read your authorized private image job", security: "session", pathParameters: ["jobId"] },
  { operationId: "cancelImageGeneration", method: "post", path: "/api/v1/generations/{jobId}/cancel", responseSchema: "ImageGenerationResponse", requestSchema: "CancelImageGeneration", summary: "Stop publication of your image job; provider billing may continue", security: "session", pathParameters: ["jobId"] },
  { operationId: "getSpatialScene", method: "get", path: "/api/v1/projects/{projectId}/spatial-scene", responseSchema: "SpatialSceneResponse", summary: "Read the authorized canonical project scene", security: "session", pathParameters: ["projectId"] },
  { operationId: "saveSpatialScene", method: "put", path: "/api/v1/projects/{projectId}/spatial-scene", responseSchema: "SpatialSceneResponse", requestSchema: "SaveSpatialScene", summary: "Save a canonical scene with an expected revision", security: "session", pathParameters: ["projectId"] },
  { operationId: "getCreativeCapabilities", method: "get", path: "/api/v1/capabilities", responseSchema: "CreativeCapabilitiesResponse", summary: "Read implemented creative-generation capabilities", security: "public" },
  { operationId: "listProjects", method: "get", path: "/api/v1/projects", responseSchema: "ProjectListResponse", summary: "List authorized projects", security: "session" },
  { operationId: "createProject", method: "post", path: "/api/v1/projects", responseSchema: "ProjectDetailResponse", requestSchema: "CreateProject", summary: "Create a project in the personal workspace", security: "session", successStatus: 201 },
  { operationId: "getProject", method: "get", path: "/api/v1/projects/{projectId}", responseSchema: "ProjectDetailResponse", summary: "Read an authorized project", security: "session", pathParameters: ["projectId"] },
  { operationId: "updateProject", method: "patch", path: "/api/v1/projects/{projectId}", responseSchema: "ProjectDetailResponse", requestSchema: "UpdateProject", summary: "Update an editable project", security: "session", pathParameters: ["projectId"] },
  { operationId: "listProjectAssets", method: "get", path: "/api/v1/projects/{projectId}/assets", responseSchema: "AssetListResponse", summary: "Read the latest 100 ready assets in an authorized project", security: "session", pathParameters: ["projectId"] },
  { operationId: "getCreativeDraft", method: "get", path: "/api/v1/projects/{projectId}/creative-draft", responseSchema: "CreativeDraftResponse", summary: "Read the current user's private prompt draft", security: "session", pathParameters: ["projectId"] },
  { operationId: "saveCreativeDraft", method: "put", path: "/api/v1/projects/{projectId}/creative-draft", responseSchema: "CreativeDraftResponse", requestSchema: "SaveCreativeDraft", summary: "Save the current user's prompt draft using an expected revision", security: "session", pathParameters: ["projectId"] },
] as const satisfies readonly {
  operationId: string; method: "get" | "post" | "put" | "patch"; path: string;
  responseSchema: keyof typeof ShapeApiSchemas; requestSchema?: keyof typeof ShapeApiSchemas;
  summary: string; security: "public" | "session"; pathParameters?: readonly string[]; successStatus?: number;
}[];
