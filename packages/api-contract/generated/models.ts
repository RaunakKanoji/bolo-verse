// Generated from openapi.json. Do not edit.
// DTO types only; server Zod schemas enforce constraints.

export type CreateImageUpload = {
  projectId: string;
  idempotencyKey: string;
  fileName: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  byteSize: number;
  checksumSha256: string;
};

export type FinalizeImageUpload = Record<string, never>;

export type ImageUploadSession = {
  id: string;
  projectId: string;
  assetId: string;
  expiresAt: string;
  uploadUrl: string;
  uploadContentType: "image/png" | "image/jpeg" | "image/webp";
};

export type ImageUploadResult = {
  upload: {
  id: string;
  projectId: string;
  assetId: string;
  expiresAt: string;
  uploadUrl: string;
  uploadContentType: "image/png" | "image/jpeg" | "image/webp";
};
};

export type FinalizedImageUploadResult = {
  asset: {
  id: string;
  projectId: string;
  mimeType: string;
  byteSize: number;
  width: (number | null);
  height: (number | null);
  durationSeconds: (number | null);
  createdAt: string;
  nativeContentUrl: (string | null);
  contentUrl: (string | null);
};
};

export type ImageGenerationCapabilities = {
  availability: "configured" | "unconfigured";
  reason: string;
  models: Array<{
  id: "gemini-3.1-flash-image" | "gemini-3-pro-image" | "gemini-2.5-flash-image";
  label: string;
  aspectRatios: Array<"1:1" | "16:9" | "4:5" | "9:16">;
  referenceImage: boolean;
}>;
  maxReferenceBytes: number;
  maxPromptCharacters: number;
};

export type CreateImageGeneration = {
  projectId: string;
  idempotencyKey: string;
  prompt: string;
  modelId: "gemini-3.1-flash-image" | "gemini-3-pro-image" | "gemini-2.5-flash-image";
  aspectRatio: "1:1" | "16:9" | "4:5" | "9:16";
  referenceAssetId: (string | null);
};

export type CancelImageGeneration = Record<string, never>;

export type ImageGenerationJob = {
  id: string;
  projectId: string;
  status: "queued" | "processing" | "ready" | "failed" | "cancelled";
  prompt: string;
  modelId: "gemini-3.1-flash-image" | "gemini-3-pro-image" | "gemini-2.5-flash-image";
  aspectRatio: "1:1" | "16:9" | "4:5" | "9:16";
  referenceAssetId: (string | null);
  outputAssetId: (string | null);
  errorCode: (string | null);
  errorMessage: (string | null);
  createdAt: string;
  updatedAt: string;
};

export type ImageGenerationResult = {
  job: {
  id: string;
  projectId: string;
  status: "queued" | "processing" | "ready" | "failed" | "cancelled";
  prompt: string;
  modelId: "gemini-3.1-flash-image" | "gemini-3-pro-image" | "gemini-2.5-flash-image";
  aspectRatio: "1:1" | "16:9" | "4:5" | "9:16";
  referenceAssetId: (string | null);
  outputAssetId: (string | null);
  errorCode: (string | null);
  errorMessage: (string | null);
  createdAt: string;
  updatedAt: string;
};
};

export type ImageGenerationList = {
  jobs: Array<{
  id: string;
  projectId: string;
  status: "queued" | "processing" | "ready" | "failed" | "cancelled";
  prompt: string;
  modelId: "gemini-3.1-flash-image" | "gemini-3-pro-image" | "gemini-2.5-flash-image";
  aspectRatio: "1:1" | "16:9" | "4:5" | "9:16";
  referenceAssetId: (string | null);
  outputAssetId: (string | null);
  errorCode: (string | null);
  errorMessage: (string | null);
  createdAt: string;
  updatedAt: string;
}>;
};

export type ImageUploadResponse = {
  ok: true;
  data: {
  upload: {
  id: string;
  projectId: string;
  assetId: string;
  expiresAt: string;
  uploadUrl: string;
  uploadContentType: "image/png" | "image/jpeg" | "image/webp";
};
};
  requestId: string;
};

export type FinalizedImageUploadResponse = {
  ok: true;
  data: {
  asset: {
  id: string;
  projectId: string;
  mimeType: string;
  byteSize: number;
  width: (number | null);
  height: (number | null);
  durationSeconds: (number | null);
  createdAt: string;
  nativeContentUrl: (string | null);
  contentUrl: (string | null);
};
};
  requestId: string;
};

export type ImageGenerationCapabilitiesResponse = {
  ok: true;
  data: {
  availability: "configured" | "unconfigured";
  reason: string;
  models: Array<{
  id: "gemini-3.1-flash-image" | "gemini-3-pro-image" | "gemini-2.5-flash-image";
  label: string;
  aspectRatios: Array<"1:1" | "16:9" | "4:5" | "9:16">;
  referenceImage: boolean;
}>;
  maxReferenceBytes: number;
  maxPromptCharacters: number;
};
  requestId: string;
};

export type ImageGenerationResponse = {
  ok: true;
  data: {
  job: {
  id: string;
  projectId: string;
  status: "queued" | "processing" | "ready" | "failed" | "cancelled";
  prompt: string;
  modelId: "gemini-3.1-flash-image" | "gemini-3-pro-image" | "gemini-2.5-flash-image";
  aspectRatio: "1:1" | "16:9" | "4:5" | "9:16";
  referenceAssetId: (string | null);
  outputAssetId: (string | null);
  errorCode: (string | null);
  errorMessage: (string | null);
  createdAt: string;
  updatedAt: string;
};
};
  requestId: string;
};

export type ImageGenerationListResponse = {
  ok: true;
  data: {
  jobs: Array<{
  id: string;
  projectId: string;
  status: "queued" | "processing" | "ready" | "failed" | "cancelled";
  prompt: string;
  modelId: "gemini-3.1-flash-image" | "gemini-3-pro-image" | "gemini-2.5-flash-image";
  aspectRatio: "1:1" | "16:9" | "4:5" | "9:16";
  referenceAssetId: (string | null);
  outputAssetId: (string | null);
  errorCode: (string | null);
  errorMessage: (string | null);
  createdAt: string;
  updatedAt: string;
}>;
};
  requestId: string;
};

export type CanonicalSpatialObject = {
  id: string;
  assetId: string;
  position: [number, number, number];
  rotation: [number, number, number, number];
  scale: [number, number, number];
  visible: boolean;
};

export type CanonicalSpatialScene = {
  sceneId: string;
  version: 1;
  objects: Array<{
  id: string;
  assetId: string;
  position: [number, number, number];
  rotation: [number, number, number, number];
  scale: [number, number, number];
  visible: boolean;
}>;
};

export type SpatialSceneSnapshot = {
  projectId: string;
  sceneId: string;
  revision: number;
  document: {
  sceneId: string;
  version: 1;
  objects: Array<{
  id: string;
  assetId: string;
  position: [number, number, number];
  rotation: [number, number, number, number];
  scale: [number, number, number];
  visible: boolean;
}>;
};
  updatedAt: (string | null);
  canEdit: boolean;
};

export type SpatialSceneResult = {
  scene: {
  projectId: string;
  sceneId: string;
  revision: number;
  document: {
  sceneId: string;
  version: 1;
  objects: Array<{
  id: string;
  assetId: string;
  position: [number, number, number];
  rotation: [number, number, number, number];
  scale: [number, number, number];
  visible: boolean;
}>;
};
  updatedAt: (string | null);
  canEdit: boolean;
};
};

export type SaveSpatialScene = {
  expectedRevision: number;
  document: {
  sceneId: string;
  version: 1;
  objects: Array<{
  id: string;
  assetId: string;
  position: [number, number, number];
  rotation: [number, number, number, number];
  scale: [number, number, number];
  visible: boolean;
}>;
};
};

export type SpatialSceneResponse = {
  ok: true;
  data: {
  scene: {
  projectId: string;
  sceneId: string;
  revision: number;
  document: {
  sceneId: string;
  version: 1;
  objects: Array<{
  id: string;
  assetId: string;
  position: [number, number, number];
  rotation: [number, number, number, number];
  scale: [number, number, number];
  visible: boolean;
}>;
};
  updatedAt: (string | null);
  canEdit: boolean;
};
};
  requestId: string;
};

export type CreativeMode = "image" | "video" | "audio" | "model3d";

export type CreativeDraftDocument = {
  schemaVersion: 1;
  mode: "image" | "video" | "audio" | "model3d";
  prompts: {
  image: string;
  video: string;
  audio: string;
  model3d: string;
};
};

export type CreativeDraftSnapshot = {
  projectId: string;
  revision: number;
  document: {
  schemaVersion: 1;
  mode: "image" | "video" | "audio" | "model3d";
  prompts: {
  image: string;
  video: string;
  audio: string;
  model3d: string;
};
};
  updatedAt: (string | null);
  canEdit: boolean;
};

export type SaveCreativeDraft = {
  expectedRevision: number;
  document: {
  schemaVersion: 1;
  mode: "image" | "video" | "audio" | "model3d";
  prompts: {
  image: string;
  video: string;
  audio: string;
  model3d: string;
};
};
};

export type CreativeDraftResult = {
  draft: {
  projectId: string;
  revision: number;
  document: {
  schemaVersion: 1;
  mode: "image" | "video" | "audio" | "model3d";
  prompts: {
  image: string;
  video: string;
  audio: string;
  model3d: string;
};
};
  updatedAt: (string | null);
  canEdit: boolean;
};
};

export type CreativeCapabilities = {
  schemaVersion: 1;
  modes: Array<{
  id: "image" | "video" | "audio" | "model3d";
  label: string;
  availability: "not_implemented";
  reason: string;
  settings: Array<string>;
}>;
};

export type ProjectSummary = {
  id: string;
  name: string;
  objective: string;
  sample: boolean;
  createdAt: string;
};

export type ProjectList = {
  projects: Array<{
  id: string;
  name: string;
  objective: string;
  sample: boolean;
  createdAt: string;
}>;
};

export type ProjectDetail = {
  project: {
  id: string;
  name: string;
  objective: string;
  sample: boolean;
  createdAt: string;
};
};

export type CreateProject = {
  name: string;
  objective: string;
};

export type UpdateProject = {
  name?: string;
  objective?: string;
};

export type AssetSummary = {
  id: string;
  projectId: string;
  mimeType: string;
  byteSize: number;
  width: (number | null);
  height: (number | null);
  durationSeconds: (number | null);
  createdAt: string;
  nativeContentUrl: (string | null);
  contentUrl: (string | null);
};

export type AssetList = {
  assets: Array<{
  id: string;
  projectId: string;
  mimeType: string;
  byteSize: number;
  width: (number | null);
  height: (number | null);
  durationSeconds: (number | null);
  createdAt: string;
  nativeContentUrl: (string | null);
  contentUrl: (string | null);
}>;
  hasMore: boolean;
};

export type ApiError = {
  code: string;
  message: string;
  retryable: boolean;
};

export type ErrorResponse = {
  ok: false;
  error: {
  code: string;
  message: string;
  retryable: boolean;
};
  requestId: string;
};

export type ProjectListResponse = {
  ok: true;
  data: {
  projects: Array<{
  id: string;
  name: string;
  objective: string;
  sample: boolean;
  createdAt: string;
}>;
};
  requestId: string;
};

export type ProjectDetailResponse = {
  ok: true;
  data: {
  project: {
  id: string;
  name: string;
  objective: string;
  sample: boolean;
  createdAt: string;
};
};
  requestId: string;
};

export type AssetListResponse = {
  ok: true;
  data: {
  assets: Array<{
  id: string;
  projectId: string;
  mimeType: string;
  byteSize: number;
  width: (number | null);
  height: (number | null);
  durationSeconds: (number | null);
  createdAt: string;
  nativeContentUrl: (string | null);
  contentUrl: (string | null);
}>;
  hasMore: boolean;
};
  requestId: string;
};

export type CreativeDraftResponse = {
  ok: true;
  data: {
  draft: {
  projectId: string;
  revision: number;
  document: {
  schemaVersion: 1;
  mode: "image" | "video" | "audio" | "model3d";
  prompts: {
  image: string;
  video: string;
  audio: string;
  model3d: string;
};
};
  updatedAt: (string | null);
  canEdit: boolean;
};
};
  requestId: string;
};

export type CreativeCapabilitiesResponse = {
  ok: true;
  data: {
  schemaVersion: 1;
  modes: Array<{
  id: "image" | "video" | "audio" | "model3d";
  label: string;
  availability: "not_implemented";
  reason: string;
  settings: Array<string>;
}>;
};
  requestId: string;
};
