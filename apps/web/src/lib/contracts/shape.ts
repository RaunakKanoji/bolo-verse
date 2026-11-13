import { CreateImageUploadSchema, FinalizeImageUploadSchema, ImageUploadSessionSchema, ImageUploadResultSchema, FinalizedImageUploadResultSchema, ImageGenerationCapabilitiesSchema, CreateImageGenerationSchema, CancelImageGenerationSchema, ImageGenerationJobSchema, ImageGenerationResultSchema, ImageGenerationListSchema } from "./creation";
import { AssetSummarySchema } from "./assets";
export { AssetSummarySchema, type AssetSummary } from "./assets";
import { z } from "zod";
import * as WorkspaceAPI from "./workspace";
import * as BrainstormStudioAPI from "./brainstorm-studio";
import * as VideoEditorAPI from "./video-editor";
import { ApiErrorSchema, RequestIdSchema, ResourceIdSchema } from "./api";
import { CreateProjectSchema, UpdateProjectSchema } from "./projects";
import { CanonicalSpatialObjectSchema, CanonicalSpatialSceneSchema, SpatialSceneSnapshotSchema, SpatialSceneResultSchema, SaveSpatialSceneSchema } from "./spatial-scene";
import { ProjectBriefResultSchema, SaveProjectBriefSchema } from "./project-briefs";
import { BrainstormRequestSchema, BrainstormResultSchema } from "./brainstorm";
import { PublishDeliverableSchema, DeliverableSchema, DeliverableResultSchema, DeliverableListSchema, UploadedImageSourceSchema } from "./deliverables";
import { ShareReviewSchema, RevokeReviewSchema, ReviewCommentInputSchema, ReviewDecisionInputSchema, ReviewGrantSchema, ReviewGrantResultSchema, ReviewDetailSchema, ReviewResultSchema, ReviewInboxSchema, ReviewFeedbackResultSchema } from "./reviews";

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
export const ProjectBriefSuccessSchema = successEnvelope(ProjectBriefResultSchema);
export const BrainstormSuccessSchema = successEnvelope(BrainstormResultSchema);
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
  VideoEditorDocument: VideoEditorAPI.VideoEditorDocumentSchema,
  VideoEditorCapabilities: VideoEditorAPI.VideoEditorCapabilitiesSchema,
  VideoEditorDraft: VideoEditorAPI.VideoEditorDraftSchema,
  SaveVideoEditorDraft: VideoEditorAPI.SaveVideoEditorDraftSchema,
  CreateVideoRender: VideoEditorAPI.CreateVideoRenderSchema,
  RefreshVideoRender: z.strictObject({}),
  VideoRenderJob: VideoEditorAPI.VideoRenderJobSchema,
  VideoEditorResponse: successEnvelope(VideoEditorAPI.VideoEditorResultSchema),
  VideoRenderResponse: successEnvelope(VideoEditorAPI.VideoRenderResultSchema),
  VideoRenderListResponse: successEnvelope(VideoEditorAPI.VideoRenderListSchema),
  CreateStudioProject: WorkspaceAPI.CreateStudioProjectSchema,
  UpdateStudioProject: WorkspaceAPI.UpdateStudioProjectSchema,
  DuplicateStudioProject: WorkspaceAPI.DuplicateStudioProjectSchema,
  CreateStudioClient: WorkspaceAPI.CreateStudioClientSchema,
  UpdateStudioClient: WorkspaceAPI.UpdateStudioClientSchema,
  CreateStudioTask: WorkspaceAPI.CreateStudioTaskSchema,
  UpdateStudioTask: WorkspaceAPI.UpdateStudioTaskSchema,
  UpdateStudioAsset: WorkspaceAPI.UpdateStudioAssetSchema,
  StudioProject: WorkspaceAPI.StudioProjectSchema,
  StudioClient: WorkspaceAPI.StudioClientSchema,
  StudioTask: WorkspaceAPI.StudioTaskSchema,
  StudioAsset: WorkspaceAPI.StudioAssetSchema,
  StudioOverviewResponse: successEnvelope(WorkspaceAPI.StudioOverviewSchema),
  StudioProjectListResponse: successEnvelope(WorkspaceAPI.StudioProjectListSchema),
  StudioProjectDetailResponse: successEnvelope(WorkspaceAPI.StudioProjectDetailSchema),
  StudioProjectMutationResponse: successEnvelope(WorkspaceAPI.StudioProjectMutationSchema),
  StudioClientListResponse: successEnvelope(WorkspaceAPI.StudioClientListSchema),
  StudioClientDetailResponse: successEnvelope(WorkspaceAPI.StudioClientDetailSchema),
  StudioClientMutationResponse: successEnvelope(WorkspaceAPI.StudioClientMutationSchema),
  StudioTaskMutationResponse: successEnvelope(WorkspaceAPI.StudioTaskMutationSchema),
  StudioAssetListResponse: successEnvelope(WorkspaceAPI.StudioAssetListSchema),
  StudioAssetMutationResponse: successEnvelope(WorkspaceAPI.StudioAssetMutationSchema),
  CreateBrainstormSession: BrainstormStudioAPI.CreateBrainstormSessionSchema,
  UpdateBrainstormSession: BrainstormStudioAPI.UpdateBrainstormSessionSchema,
  SendBrainstormMessage: BrainstormStudioAPI.SendBrainstormMessageSchema,
  SaveBrainstormIdea: BrainstormStudioAPI.SaveBrainstormIdeaSchema,
  BrainstormConcept: BrainstormStudioAPI.BrainstormConceptSchema,
  BrainstormSession: BrainstormStudioAPI.BrainstormSessionSchema,
  BrainstormIdea: BrainstormStudioAPI.BrainstormIdeaSchema,
  BrainstormSessionListResponse: successEnvelope(BrainstormStudioAPI.BrainstormSessionListSchema),
  BrainstormSessionDetailResponse: successEnvelope(BrainstormStudioAPI.BrainstormSessionDetailSchema),
  BrainstormSessionMutationResponse: successEnvelope(z.strictObject({session: BrainstormStudioAPI.BrainstormSessionSchema})),
  BrainstormMessageResponse: successEnvelope(z.strictObject({session: BrainstormStudioAPI.BrainstormSessionSchema,message: BrainstormStudioAPI.BrainstormMessageSchema})),
  BrainstormIdeaResponse: successEnvelope(z.strictObject({session: BrainstormStudioAPI.BrainstormSessionSchema,idea: BrainstormStudioAPI.BrainstormIdeaSchema})),
  ShareReview: ShareReviewSchema, RevokeReview: RevokeReviewSchema,
  ReviewCommentInput: ReviewCommentInputSchema, ReviewDecisionInput: ReviewDecisionInputSchema,
  ReviewGrant: ReviewGrantSchema, ReviewDetail: ReviewDetailSchema, ReviewInbox: ReviewInboxSchema,
  ReviewGrantResponse: successEnvelope(ReviewGrantResultSchema), ReviewResponse: successEnvelope(ReviewResultSchema),
  ReviewInboxResponse: successEnvelope(ReviewInboxSchema), ReviewFeedbackResponse: successEnvelope(ReviewFeedbackResultSchema),
  PublishDeliverable: PublishDeliverableSchema,
  UploadedImageSource: UploadedImageSourceSchema,
  Deliverable: DeliverableSchema,
  DeliverableResult: DeliverableResultSchema,
  DeliverableList: DeliverableListSchema,
  DeliverableResponse: successEnvelope(DeliverableResultSchema),
  DeliverableListResponse: successEnvelope(DeliverableListSchema),
  BrainstormRequest: BrainstormRequestSchema,
  BrainstormResult: BrainstormResultSchema,
  BrainstormResponse: BrainstormSuccessSchema,
  SaveProjectBrief: SaveProjectBriefSchema,
  ProjectBriefResult: ProjectBriefResultSchema,
  ProjectBriefResponse: ProjectBriefSuccessSchema,
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
  { operationId:"getVideoEditor",method:"get",path:"/api/v1/projects/{projectId}/video-editor",responseSchema:"VideoEditorResponse",summary:"Read the actor-private video draft and unverified render configuration for an editable project",security:"session",pathParameters:["projectId"] },
  { operationId:"saveVideoEditorDraft",method:"put",path:"/api/v1/projects/{projectId}/video-editor",requestSchema:"SaveVideoEditorDraft",responseSchema:"VideoEditorResponse",summary:"Save a bounded asset-ID-only video timeline with revision compare and swap",security:"session",pathParameters:["projectId"] },
  { operationId:"listVideoRenders",method:"get",path:"/api/v1/projects/{projectId}/video-editor/renders",responseSchema:"VideoRenderListResponse",summary:"List the actor's authorized video render attempts without dispatching provider work",security:"session",pathParameters:["projectId"] },
  { operationId:"createVideoRender",method:"post",path:"/api/v1/projects/{projectId}/video-editor/renders",requestSchema:"CreateVideoRender",responseSchema:"VideoRenderResponse",summary:"Explicitly consent to one durable render attempt from an exact saved draft revision",security:"session",pathParameters:["projectId"] },
  { operationId:"getVideoRender",method:"get",path:"/api/v1/projects/{projectId}/video-editor/renders/{jobId}",responseSchema:"VideoRenderResponse",summary:"Read an authorized stored render state and private output projection",security:"session",pathParameters:["projectId","jobId"] },
  { operationId:"refreshVideoRender",method:"post",path:"/api/v1/projects/{projectId}/video-editor/renders/{jobId}/refresh",requestSchema:"RefreshVideoRender",responseSchema:"VideoRenderResponse",summary:"Refresh the stored provider job and verify/import its output without submitting another render",security:"session",pathParameters:["projectId","jobId"] },
  { operationId:"getStudioOverview",method:"get",path:"/api/v1/workspace/overview",responseSchema:"StudioOverviewResponse",summary:"Read actual authorized project metrics, editable tasks and persisted activity",security:"session" },
  { operationId:"listStudioProjects",method:"get",path:"/api/v1/workspace/projects",responseSchema:"StudioProjectListResponse",summary:"List authorized projects with bounded search, filters and pagination",security:"session" },
  { operationId:"createStudioProject",method:"post",path:"/api/v1/workspace/projects",requestSchema:"CreateStudioProject",responseSchema:"StudioProjectMutationResponse",summary:"Create an idempotent project with authorized client association and planning metadata",security:"session",successStatus:201 },
  { operationId:"getStudioProject",method:"get",path:"/api/v1/workspace/projects/{projectId}",responseSchema:"StudioProjectDetailResponse",summary:"Read an authorized project and editor-only internal tasks",security:"session",pathParameters:["projectId"] },
  { operationId:"updateStudioProject",method:"patch",path:"/api/v1/workspace/projects/{projectId}",requestSchema:"UpdateStudioProject",responseSchema:"StudioProjectMutationResponse",summary:"Update project metadata with expected revision and current editor permission",security:"session",pathParameters:["projectId"] },
  { operationId:"duplicateStudioProject",method:"post",path:"/api/v1/workspace/projects/{projectId}/duplicate",requestSchema:"DuplicateStudioProject",responseSchema:"StudioProjectMutationResponse",summary:"Clone planning metadata without assets, approvals or foreign client privileges",security:"session",pathParameters:["projectId"],successStatus:201 },
  { operationId:"createStudioTask",method:"post",path:"/api/v1/workspace/projects/{projectId}/tasks",requestSchema:"CreateStudioTask",responseSchema:"StudioTaskMutationResponse",summary:"Create an authorized project task with an idempotency key",security:"session",pathParameters:["projectId"],successStatus:201 },
  { operationId:"updateStudioTask",method:"patch",path:"/api/v1/workspace/projects/{projectId}/tasks/{taskId}",requestSchema:"UpdateStudioTask",responseSchema:"StudioTaskMutationResponse",summary:"Update a project task using revision compare and swap",security:"session",pathParameters:["projectId","taskId"] },
  { operationId:"listStudioClients",method:"get",path:"/api/v1/workspace/clients",responseSchema:"StudioClientListResponse",summary:"List private client directory records in the current authorized workspace",security:"session" },
  { operationId:"createStudioClient",method:"post",path:"/api/v1/workspace/clients",requestSchema:"CreateStudioClient",responseSchema:"StudioClientMutationResponse",summary:"Create a client directory record with scoped idempotency",security:"session",successStatus:201 },
  { operationId:"getStudioClient",method:"get",path:"/api/v1/workspace/clients/{clientId}",responseSchema:"StudioClientDetailResponse",summary:"Read an authorized client and its actual associated projects",security:"session",pathParameters:["clientId"] },
  { operationId:"updateStudioClient",method:"patch",path:"/api/v1/workspace/clients/{clientId}",requestSchema:"UpdateStudioClient",responseSchema:"StudioClientMutationResponse",summary:"Update a private client record using revision compare and swap",security:"session",pathParameters:["clientId"] },
  { operationId:"listStudioAssets",method:"get",path:"/api/v1/workspace/assets",responseSchema:"StudioAssetListResponse",summary:"Browse ready authorized assets with bounded type, project, collection and archive filters",security:"session" },
  { operationId:"updateStudioAsset",method:"patch",path:"/api/v1/workspace/assets/{assetId}",requestSchema:"UpdateStudioAsset",responseSchema:"StudioAssetMutationResponse",summary:"Organize or reversibly archive an asset without mutating immutable media",security:"session",pathParameters:["assetId"] },
  { operationId:"listBrainstormSessions",method:"get",path:"/api/v1/brainstorm/sessions",responseSchema:"BrainstormSessionListResponse",summary:"List only the verified author's currently authorized private sessions",security:"session" },
  { operationId:"createBrainstormSession",method:"post",path:"/api/v1/brainstorm/sessions",requestSchema:"CreateBrainstormSession",responseSchema:"BrainstormSessionMutationResponse",summary:"Create a private ideation session with an optional authorized project",security:"session",successStatus:201 },
  { operationId:"getBrainstormSession",method:"get",path:"/api/v1/brainstorm/sessions/{sessionId}",responseSchema:"BrainstormSessionDetailResponse",summary:"Read bounded private session messages and saved ideas",security:"session",pathParameters:["sessionId"] },
  { operationId:"updateBrainstormSession",method:"patch",path:"/api/v1/brainstorm/sessions/{sessionId}",requestSchema:"UpdateBrainstormSession",responseSchema:"BrainstormSessionMutationResponse",summary:"Rename, pin or relink a private session using revision and idempotency",security:"session",pathParameters:["sessionId"] },
  { operationId:"sendBrainstormMessage",method:"post",path:"/api/v1/brainstorm/sessions/{sessionId}/messages",requestSchema:"SendBrainstormMessage",responseSchema:"BrainstormMessageResponse",summary:"Persist an explicit message and validated Gemini response without automatic uncertain retries",security:"session",pathParameters:["sessionId"] },
  { operationId:"saveBrainstormIdea",method:"post",path:"/api/v1/brainstorm/sessions/{sessionId}/ideas",requestSchema:"SaveBrainstormIdea",responseSchema:"BrainstormIdeaResponse",summary:"Save a bounded private idea with revision and idempotent identity",security:"session",pathParameters:["sessionId"],successStatus:201 },
  { operationId: "listClientReviews", method: "get", path: "/api/v1/reviews", responseSchema: "ReviewInboxResponse", summary: "Read only versions explicitly assigned to the current verified subject", security: "session" },
  { operationId: "getClientReview", method: "get", path: "/api/v1/reviews/{versionId}", responseSchema: "ReviewResponse", summary: "Read one actively granted published version without project privileges", security: "session", pathParameters: ["versionId"] },
  { operationId: "commentOnReview", method: "post", path: "/api/v1/reviews/{versionId}/comments", requestSchema: "ReviewCommentInput", responseSchema: "ReviewResponse", summary: "Append a version-and-grant-bound immutable reviewer comment", security: "session", pathParameters: ["versionId"] },
  { operationId: "decideOnReview", method: "post", path: "/api/v1/reviews/{versionId}/decision", requestSchema: "ReviewDecisionInput", responseSchema: "ReviewResponse", summary: "Append one terminal decision for the assigned reviewer and version", security: "session", pathParameters: ["versionId"] },
  { operationId: "getReviewFeedback", method: "get", path: "/api/v1/projects/{projectId}/deliverables/{deliverableId}/review-grants", responseSchema: "ReviewFeedbackResponse", summary: "Read private creator feedback and version-scoped review assignments", security: "session", pathParameters: ["projectId", "deliverableId"] },
  { operationId: "shareForReview", method: "post", path: "/api/v1/projects/{projectId}/deliverables/{deliverableId}/review-grants", requestSchema: "ShareReview", responseSchema: "ReviewGrantResponse", summary: "Verify an existing Clerk subject and grant one private published version, without membership or tokens", security: "session", pathParameters: ["projectId", "deliverableId"], successStatus: 201 },
  { operationId: "revokeReviewGrant", method: "post", path: "/api/v1/projects/{projectId}/deliverables/{deliverableId}/review-grants/{grantId}/revoke", requestSchema: "RevokeReview", responseSchema: "ReviewGrantResponse", summary: "Idempotently revoke one identity-bound review assignment", security: "session", pathParameters: ["projectId", "deliverableId", "grantId"] },
  { operationId: "publishDeliverable", method: "post", path: "/api/v1/projects/{projectId}/deliverables", responseSchema: "DeliverableResponse", requestSchema: "PublishDeliverable", summary: "Publish a verified uploaded image as an immutable private content version; grants no reviewer access", security: "session", pathParameters: ["projectId"], successStatus: 201 },
  { operationId: "listDeliverables", method: "get", path: "/api/v1/projects/{projectId}/deliverables", responseSchema: "DeliverableListResponse", summary: "Read latest 50 uploaded-image publications with project editor permission", security: "session", pathParameters: ["projectId"] },
  { operationId: "getDeliverable", method: "get", path: "/api/v1/projects/{projectId}/deliverables/{deliverableId}", responseSchema: "DeliverableResponse", summary: "Read one immutable uploaded-image publication with project editor permission", security: "session", pathParameters: ["projectId", "deliverableId"] },
  { operationId: "brainstormFromBrief", method: "post", path: "/api/v1/projects/{projectId}/brainstorm", responseSchema: "BrainstormResponse", requestSchema: "BrainstormRequest", summary: "Request ephemeral Gemini directions from an authorized saved project brief", security: "session", pathParameters: ["projectId"] },
  { operationId: "getProjectBrief", method: "get", path: "/api/v1/projects/{projectId}/brief", responseSchema: "ProjectBriefResponse", summary: "Read the latest editable brief or assigned client's latest approved brief", security: "session", pathParameters: ["projectId"] },
  { operationId: "saveProjectBrief", method: "put", path: "/api/v1/projects/{projectId}/brief", responseSchema: "ProjectBriefResponse", requestSchema: "SaveProjectBrief", summary: "Save a new project brief version with optimistic concurrency and a UUID retry key", security: "session", pathParameters: ["projectId"] },
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
