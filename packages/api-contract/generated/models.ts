// Generated from openapi.json. Do not edit.
// DTO types only; server Zod schemas enforce constraints.

export type VideoEditorDocument = {
  schemaVersion: 1;
  aspectRatio: "9:16" | "1:1" | "16:9";
  clips: Array<{
  id: string;
  assetId: string;
  startSeconds: number;
  durationSeconds: number;
  trimStartSeconds: number;
  audioLevel: number;
}>;
  overlays: Array<{
  id: string;
  kind: "title" | "caption";
  text: string;
  startSeconds: number;
  durationSeconds: number;
  style: {
  color: string;
  fontSize: number;
  align: "left" | "center" | "right";
};
}>;
};

export type VideoEditorCapabilities = {
  availability: "configured" | "unconfigured" | "disabled";
  reason: (string | null);
  environment: ("sandbox" | "production" | null);
  maxDurationSeconds: 60;
  maxClips: 50;
  outputMimeType: "video/mp4";
};

export type VideoEditorDraft = {
  projectId: string;
  revision: number;
  document: ({
  schemaVersion: 1;
  aspectRatio: "9:16" | "1:1" | "16:9";
  clips: Array<{
  id: string;
  assetId: string;
  startSeconds: number;
  durationSeconds: number;
  trimStartSeconds: number;
  audioLevel: number;
}>;
  overlays: Array<{
  id: string;
  kind: "title" | "caption";
  text: string;
  startSeconds: number;
  durationSeconds: number;
  style: {
  color: string;
  fontSize: number;
  align: "left" | "center" | "right";
};
}>;
} | null);
  updatedAt: (string | null);
  canEdit: boolean;
};

export type SaveVideoEditorDraft = {
  expectedRevision: number;
  document: {
  schemaVersion: 1;
  aspectRatio: "9:16" | "1:1" | "16:9";
  clips: Array<{
  id: string;
  assetId: string;
  startSeconds: number;
  durationSeconds: number;
  trimStartSeconds: number;
  audioLevel: number;
}>;
  overlays: Array<{
  id: string;
  kind: "title" | "caption";
  text: string;
  startSeconds: number;
  durationSeconds: number;
  style: {
  color: string;
  fontSize: number;
  align: "left" | "center" | "right";
};
}>;
};
};

export type CreateVideoRender = {
  idempotencyKey: string;
  draftRevision: number;
  consent: "shotstack-render-v1";
};

export type RefreshVideoRender = Record<string, never>;

export type VideoRenderJob = {
  id: string;
  projectId: string;
  draftRevision: number;
  status: "queued" | "processing" | "ready" | "failed" | "cancelled";
  environment: "sandbox" | "production";
  failureCode: (string | null);
  errorMessage: (string | null);
  outputAsset: ({
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
} | null);
  createdAt: string;
  updatedAt: string;
};

export type VideoEditorResponse = {
  ok: true;
  data: {
  draft: {
  projectId: string;
  revision: number;
  document: ({
  schemaVersion: 1;
  aspectRatio: "9:16" | "1:1" | "16:9";
  clips: Array<{
  id: string;
  assetId: string;
  startSeconds: number;
  durationSeconds: number;
  trimStartSeconds: number;
  audioLevel: number;
}>;
  overlays: Array<{
  id: string;
  kind: "title" | "caption";
  text: string;
  startSeconds: number;
  durationSeconds: number;
  style: {
  color: string;
  fontSize: number;
  align: "left" | "center" | "right";
};
}>;
} | null);
  updatedAt: (string | null);
  canEdit: boolean;
};
  capabilities: {
  availability: "configured" | "unconfigured" | "disabled";
  reason: (string | null);
  environment: ("sandbox" | "production" | null);
  maxDurationSeconds: 60;
  maxClips: 50;
  outputMimeType: "video/mp4";
};
};
  requestId: string;
};

export type VideoRenderResponse = {
  ok: true;
  data: {
  job: {
  id: string;
  projectId: string;
  draftRevision: number;
  status: "queued" | "processing" | "ready" | "failed" | "cancelled";
  environment: "sandbox" | "production";
  failureCode: (string | null);
  errorMessage: (string | null);
  outputAsset: ({
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
} | null);
  createdAt: string;
  updatedAt: string;
};
};
  requestId: string;
};

export type VideoRenderListResponse = {
  ok: true;
  data: {
  jobs: Array<{
  id: string;
  projectId: string;
  draftRevision: number;
  status: "queued" | "processing" | "ready" | "failed" | "cancelled";
  environment: "sandbox" | "production";
  failureCode: (string | null);
  errorMessage: (string | null);
  outputAsset: ({
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
} | null);
  createdAt: string;
  updatedAt: string;
}>;
};
  requestId: string;
};

export type CreateStudioProject = {
  idempotencyKey: string;
  name: string;
  objective: string;
  clientId: (string | null);
  type: string;
  priority: "low" | "normal" | "high";
  startDate: (string | null);
  dueDate: (string | null);
};

export type UpdateStudioProject = {
  expectedRevision: number;
  name?: string;
  objective?: string;
  clientId?: (string | null);
  type?: string;
  status?: "active" | "in_review" | "completed" | "archived";
  priority?: "low" | "normal" | "high";
  startDate?: (string | null);
  dueDate?: (string | null);
};

export type DuplicateStudioProject = {
  idempotencyKey: string;
  name?: string;
};

export type CreateStudioClient = {
  idempotencyKey: string;
  name: string;
  organization: string;
  email: string;
  phone: string;
  notes: string;
};

export type UpdateStudioClient = {
  expectedRevision: number;
  name?: string;
  organization?: string;
  email?: string;
  phone?: string;
  notes?: string;
};

export type CreateStudioTask = {
  idempotencyKey: string;
  title: string;
  priority: "low" | "normal" | "high";
  dueDate: (string | null);
  ownerLabel: string;
};

export type UpdateStudioTask = {
  expectedRevision: number;
  title?: string;
  status?: "todo" | "in_progress" | "done";
  priority?: "low" | "normal" | "high";
  dueDate?: (string | null);
  ownerLabel?: string;
};

export type UpdateStudioAsset = {
  expectedRevision: number;
  collection?: string;
  archived?: boolean;
};

export type StudioProject = {
  id: string;
  name: string;
  objective: string;
  clientId: (string | null);
  type: string;
  status: "active" | "in_review" | "completed" | "archived";
  priority: "low" | "normal" | "high";
  startDate: (string | null);
  dueDate: (string | null);
  clientName: (string | null);
  createdAt: string;
  updatedAt: string;
  revision: number;
  progress: (number | null);
  canEdit: boolean;
};

export type StudioClient = {
  id: string;
  name: string;
  organization: string;
  email: string;
  phone: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
  activeProjects: number;
  pendingReviews: number;
  lastActivityAt: (string | null);
};

export type StudioTask = {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "normal" | "high";
  dueDate: (string | null);
  ownerLabel: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type StudioAsset = {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  mimeType: string;
  category: "image" | "video" | "audio" | "document" | "3d";
  byteSize: number;
  width: (number | null);
  height: (number | null);
  createdAt: string;
  contentUrl: (string | null);
  nativeContentUrl: (string | null);
  downloadUrl: (string | null);
  collection: string;
  archived: boolean;
  revision: number;
  canEdit: boolean;
};

export type StudioOverviewResponse = {
  ok: true;
  data: {
  metrics: {
  activeProjects: number;
  pendingReviews: number;
  completedDeliverables: number;
  upcomingDeadlines: number;
};
  projects: Array<{
  id: string;
  name: string;
  objective: string;
  clientId: (string | null);
  type: string;
  status: "active" | "in_review" | "completed" | "archived";
  priority: "low" | "normal" | "high";
  startDate: (string | null);
  dueDate: (string | null);
  clientName: (string | null);
  createdAt: string;
  updatedAt: string;
  revision: number;
  progress: (number | null);
  canEdit: boolean;
}>;
  tasks: Array<{
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "normal" | "high";
  dueDate: (string | null);
  ownerLabel: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
}>;
  activity: Array<{
  id: string;
  projectId: string;
  projectName: string;
  kind: "project_created" | "brief_updated" | "asset_uploaded" | "review_submitted" | "feedback" | "approved" | "task_created" | "artifact_saved" | "concept_saved";
  title: string;
  createdAt: string;
}>;
};
  requestId: string;
};

export type StudioProjectListResponse = {
  ok: true;
  data: {
  projects: Array<{
  id: string;
  name: string;
  objective: string;
  clientId: (string | null);
  type: string;
  status: "active" | "in_review" | "completed" | "archived";
  priority: "low" | "normal" | "high";
  startDate: (string | null);
  dueDate: (string | null);
  clientName: (string | null);
  createdAt: string;
  updatedAt: string;
  revision: number;
  progress: (number | null);
  canEdit: boolean;
}>;
  total: number;
};
  requestId: string;
};

export type StudioProjectDetailResponse = {
  ok: true;
  data: {
  project: {
  id: string;
  name: string;
  objective: string;
  clientId: (string | null);
  type: string;
  status: "active" | "in_review" | "completed" | "archived";
  priority: "low" | "normal" | "high";
  startDate: (string | null);
  dueDate: (string | null);
  clientName: (string | null);
  createdAt: string;
  updatedAt: string;
  revision: number;
  progress: (number | null);
  canEdit: boolean;
};
  canEdit: boolean;
  tasks: Array<{
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "normal" | "high";
  dueDate: (string | null);
  ownerLabel: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
}>;
  activity: Array<{
  id: string;
  projectId: string;
  projectName: string;
  kind: "project_created" | "brief_updated" | "asset_uploaded" | "review_submitted" | "feedback" | "approved" | "task_created" | "artifact_saved" | "concept_saved";
  title: string;
  createdAt: string;
}>;
};
  requestId: string;
};

export type StudioProjectMutationResponse = {
  ok: true;
  data: {
  project: {
  id: string;
  name: string;
  objective: string;
  clientId: (string | null);
  type: string;
  status: "active" | "in_review" | "completed" | "archived";
  priority: "low" | "normal" | "high";
  startDate: (string | null);
  dueDate: (string | null);
  clientName: (string | null);
  createdAt: string;
  updatedAt: string;
  revision: number;
  progress: (number | null);
  canEdit: boolean;
};
};
  requestId: string;
};

export type StudioClientListResponse = {
  ok: true;
  data: {
  clients: Array<{
  id: string;
  name: string;
  organization: string;
  email: string;
  phone: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
  activeProjects: number;
  pendingReviews: number;
  lastActivityAt: (string | null);
}>;
  total: number;
};
  requestId: string;
};

export type StudioClientDetailResponse = {
  ok: true;
  data: {
  client: {
  id: string;
  name: string;
  organization: string;
  email: string;
  phone: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
  activeProjects: number;
  pendingReviews: number;
  lastActivityAt: (string | null);
};
  projects: Array<{
  id: string;
  name: string;
  objective: string;
  clientId: (string | null);
  type: string;
  status: "active" | "in_review" | "completed" | "archived";
  priority: "low" | "normal" | "high";
  startDate: (string | null);
  dueDate: (string | null);
  clientName: (string | null);
  createdAt: string;
  updatedAt: string;
  revision: number;
  progress: (number | null);
  canEdit: boolean;
}>;
  activity: Array<{
  id: string;
  projectId: string;
  projectName: string;
  kind: "project_created" | "brief_updated" | "asset_uploaded" | "review_submitted" | "feedback" | "approved" | "task_created" | "artifact_saved" | "concept_saved";
  title: string;
  createdAt: string;
}>;
};
  requestId: string;
};

export type StudioClientMutationResponse = {
  ok: true;
  data: {
  client: {
  id: string;
  name: string;
  organization: string;
  email: string;
  phone: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
  activeProjects: number;
  pendingReviews: number;
  lastActivityAt: (string | null);
};
};
  requestId: string;
};

export type StudioTaskMutationResponse = {
  ok: true;
  data: {
  task: {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "normal" | "high";
  dueDate: (string | null);
  ownerLabel: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
};
};
  requestId: string;
};

export type StudioAssetListResponse = {
  ok: true;
  data: {
  assets: Array<{
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  mimeType: string;
  category: "image" | "video" | "audio" | "document" | "3d";
  byteSize: number;
  width: (number | null);
  height: (number | null);
  createdAt: string;
  contentUrl: (string | null);
  nativeContentUrl: (string | null);
  downloadUrl: (string | null);
  collection: string;
  archived: boolean;
  revision: number;
  canEdit: boolean;
}>;
  total: number;
};
  requestId: string;
};

export type StudioAssetMutationResponse = {
  ok: true;
  data: {
  asset: {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  mimeType: string;
  category: "image" | "video" | "audio" | "document" | "3d";
  byteSize: number;
  width: (number | null);
  height: (number | null);
  createdAt: string;
  contentUrl: (string | null);
  nativeContentUrl: (string | null);
  downloadUrl: (string | null);
  collection: string;
  archived: boolean;
  revision: number;
  canEdit: boolean;
};
};
  requestId: string;
};

export type CreateBrainstormSession = {
  idempotencyKey: string;
  title: string;
  projectId?: string;
};

export type UpdateBrainstormSession = {
  idempotencyKey: string;
  expectedRevision: number;
  title?: string;
  pinned?: boolean;
  projectId?: (string | null);
};

export type SendBrainstormMessage = {
  idempotencyKey: string;
  expectedRevision: number;
  message: string;
};

export type SaveBrainstormIdea = {
  idempotencyKey: string;
  expectedRevision: number;
  title: string;
  description: string;
  tags: Array<string>;
  category: "idea" | "concept" | "direction" | "outline" | "action";
  sourceMessageId?: string;
};

export type BrainstormConcept = {
  title: string;
  targetAudience: string;
  coreMessage: string;
  contentFormat: string;
  creativeDirection: string;
  productionRequirements: Array<string>;
  nextSteps: Array<string>;
};

export type BrainstormSession = {
  id: string;
  title: string;
  projectId: (string | null);
  pinned: boolean;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type BrainstormIdea = {
  id: string;
  sessionId: string;
  title: string;
  description: string;
  tags: Array<string>;
  category: "idea" | "concept" | "direction" | "outline" | "action";
  sourceMessageId: (string | null);
  createdAt: string;
};

export type BrainstormSessionListResponse = {
  ok: true;
  data: {
  sessions: Array<{
  id: string;
  title: string;
  projectId: (string | null);
  pinned: boolean;
  revision: number;
  createdAt: string;
  updatedAt: string;
}>;
};
  requestId: string;
};

export type BrainstormSessionDetailResponse = {
  ok: true;
  data: {
  session: {
  id: string;
  title: string;
  projectId: (string | null);
  pinned: boolean;
  revision: number;
  createdAt: string;
  updatedAt: string;
};
  messages: Array<{
  id: string;
  sessionId: string;
  message: string;
  status: "pending" | "completed" | "uncertain";
  content: ({
  reply: string;
  concepts: Array<{
  title: string;
  targetAudience: string;
  coreMessage: string;
  contentFormat: string;
  creativeDirection: string;
  productionRequirements: Array<string>;
  nextSteps: Array<string>;
}>;
} | null);
  createdAt: string;
}>;
  ideas: Array<{
  id: string;
  sessionId: string;
  title: string;
  description: string;
  tags: Array<string>;
  category: "idea" | "concept" | "direction" | "outline" | "action";
  sourceMessageId: (string | null);
  createdAt: string;
}>;
};
  requestId: string;
};

export type BrainstormSessionMutationResponse = {
  ok: true;
  data: {
  session: {
  id: string;
  title: string;
  projectId: (string | null);
  pinned: boolean;
  revision: number;
  createdAt: string;
  updatedAt: string;
};
};
  requestId: string;
};

export type BrainstormMessageResponse = {
  ok: true;
  data: {
  session: {
  id: string;
  title: string;
  projectId: (string | null);
  pinned: boolean;
  revision: number;
  createdAt: string;
  updatedAt: string;
};
  message: {
  id: string;
  sessionId: string;
  message: string;
  status: "pending" | "completed" | "uncertain";
  content: ({
  reply: string;
  concepts: Array<{
  title: string;
  targetAudience: string;
  coreMessage: string;
  contentFormat: string;
  creativeDirection: string;
  productionRequirements: Array<string>;
  nextSteps: Array<string>;
}>;
} | null);
  createdAt: string;
};
};
  requestId: string;
};

export type BrainstormIdeaResponse = {
  ok: true;
  data: {
  session: {
  id: string;
  title: string;
  projectId: (string | null);
  pinned: boolean;
  revision: number;
  createdAt: string;
  updatedAt: string;
};
  idea: {
  id: string;
  sessionId: string;
  title: string;
  description: string;
  tags: Array<string>;
  category: "idea" | "concept" | "direction" | "outline" | "action";
  sourceMessageId: (string | null);
  createdAt: string;
};
};
  requestId: string;
};

export type ShareReview = {
  reviewerId: string;
  idempotencyKey: string;
  expiresInDays?: number;
};

export type RevokeReview = Record<string, never>;

export type ReviewCommentInput = {
  grantId: string;
  expectedVersion: number;
  idempotencyKey: string;
  comment: string;
  timecodeSeconds?: number;
};

export type ReviewDecisionInput = {
  grantId: string;
  expectedVersion: number;
  idempotencyKey: string;
  decision: "approved" | "changes_requested";
  comment?: string;
};

export type ReviewGrant = {
  grantId: string;
  reviewId: string;
  expiresAt: string;
  revokedAt: (string | null);
  createdAt: string;
  active: boolean;
  reviewUrl: string;
};

export type ReviewDetail = {
  reviewId: string;
  grantId: string;
  version: number;
  title: string;
  caption: string;
  publishedAt: string;
  expiresAt: string;
  preview: {
  url: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  byteSize: number;
  width: number;
  height: number;
};
  comments: Array<{
  id: string;
  grantId: (string | null);
  comment: string;
  timecodeSeconds: (number | null);
  createdAt: string;
}>;
  decision: ({
  id: string;
  grantId: (string | null);
  decision: "approved" | "changes_requested";
  comment: (string | null);
  createdAt: string;
} | null);
  history?: Array<{
  reviewId: string;
  grantId: string;
  version: number;
  title: string;
  expiresAt: string;
  decision: ({
  id: string;
  grantId: (string | null);
  decision: "approved" | "changes_requested";
  comment: (string | null);
  createdAt: string;
} | null);
}>;
};

export type ReviewInbox = {
  reviews: Array<{
  reviewId: string;
  grantId: string;
  version: number;
  title: string;
  expiresAt: string;
  decision: ({
  id: string;
  grantId: (string | null);
  decision: "approved" | "changes_requested";
  comment: (string | null);
  createdAt: string;
} | null);
}>;
  hasMore: boolean;
};

export type ReviewGrantResponse = {
  ok: true;
  data: {
  grant: {
  grantId: string;
  reviewId: string;
  expiresAt: string;
  revokedAt: (string | null);
  createdAt: string;
  active: boolean;
  reviewUrl: string;
};
};
  requestId: string;
};

export type ReviewResponse = {
  ok: true;
  data: {
  review: {
  reviewId: string;
  grantId: string;
  version: number;
  title: string;
  caption: string;
  publishedAt: string;
  expiresAt: string;
  preview: {
  url: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  byteSize: number;
  width: number;
  height: number;
};
  comments: Array<{
  id: string;
  grantId: (string | null);
  comment: string;
  timecodeSeconds: (number | null);
  createdAt: string;
}>;
  decision: ({
  id: string;
  grantId: (string | null);
  decision: "approved" | "changes_requested";
  comment: (string | null);
  createdAt: string;
} | null);
  history?: Array<{
  reviewId: string;
  grantId: string;
  version: number;
  title: string;
  expiresAt: string;
  decision: ({
  id: string;
  grantId: (string | null);
  decision: "approved" | "changes_requested";
  comment: (string | null);
  createdAt: string;
} | null);
}>;
};
};
  requestId: string;
};

export type ReviewInboxResponse = {
  ok: true;
  data: {
  reviews: Array<{
  reviewId: string;
  grantId: string;
  version: number;
  title: string;
  expiresAt: string;
  decision: ({
  id: string;
  grantId: (string | null);
  decision: "approved" | "changes_requested";
  comment: (string | null);
  createdAt: string;
} | null);
}>;
  hasMore: boolean;
};
  requestId: string;
};

export type ReviewFeedbackResponse = {
  ok: true;
  data: {
  feedback: {
  reviewId: string;
  version: number;
  grants: Array<{
  grantId: string;
  reviewId: string;
  expiresAt: string;
  revokedAt: (string | null);
  createdAt: string;
  active: boolean;
  reviewUrl: string;
}>;
  comments: Array<{
  id: string;
  grantId: (string | null);
  comment: string;
  timecodeSeconds: (number | null);
  createdAt: string;
}>;
  decisions: Array<{
  id: string;
  grantId: (string | null);
  decision: "approved" | "changes_requested";
  comment: (string | null);
  createdAt: string;
}>;
  latestDecision: ({
  id: string;
  grantId: (string | null);
  decision: "approved" | "changes_requested";
  comment: (string | null);
  createdAt: string;
} | null);
};
};
  requestId: string;
};

export type PublishDeliverable = {
  assetId: string;
  title: string;
  caption?: string;
  briefVersion?: number;
  sceneRevision?: number;
  idempotencyKey: string;
  revision?: {
  supersedesVersionId: string;
  expectedVersion: number;
  expectedDecisionId: string;
};
};

export type UploadedImageSource = {
  schemaVersion: 2;
  sourceType: "uploaded_image";
  projectId: string;
  assetId: string;
  checksumSha256: string;
  briefVersion?: number;
  sceneRevision?: number;
  sceneRelation?: "context_only";
  revision?: {
  supersedesVersionId: string;
  expectedVersion: number;
  expectedDecisionId: string;
};
};

export type Deliverable = {
  deliverableId: string;
  projectId: string;
  version: number;
  title: string;
  caption: string;
  status: "published";
  publishedAt: string;
  source: {
  schemaVersion: 2;
  sourceType: "uploaded_image";
  projectId: string;
  assetId: string;
  checksumSha256: string;
  briefVersion?: number;
  sceneRevision?: number;
  sceneRelation?: "context_only";
  revision?: {
  supersedesVersionId: string;
  expectedVersion: number;
  expectedDecisionId: string;
};
};
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

export type DeliverableResult = {
  deliverable: {
  deliverableId: string;
  projectId: string;
  version: number;
  title: string;
  caption: string;
  status: "published";
  publishedAt: string;
  source: {
  schemaVersion: 2;
  sourceType: "uploaded_image";
  projectId: string;
  assetId: string;
  checksumSha256: string;
  briefVersion?: number;
  sceneRevision?: number;
  sceneRelation?: "context_only";
  revision?: {
  supersedesVersionId: string;
  expectedVersion: number;
  expectedDecisionId: string;
};
};
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
};

export type DeliverableList = {
  deliverables: Array<{
  deliverableId: string;
  projectId: string;
  version: number;
  title: string;
  caption: string;
  status: "published";
  publishedAt: string;
  source: {
  schemaVersion: 2;
  sourceType: "uploaded_image";
  projectId: string;
  assetId: string;
  checksumSha256: string;
  briefVersion?: number;
  sceneRevision?: number;
  sceneRelation?: "context_only";
  revision?: {
  supersedesVersionId: string;
  expectedVersion: number;
  expectedDecisionId: string;
};
};
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
}>;
  hasMore: boolean;
  canPublish: boolean;
};

export type DeliverableResponse = {
  ok: true;
  data: {
  deliverable: {
  deliverableId: string;
  projectId: string;
  version: number;
  title: string;
  caption: string;
  status: "published";
  publishedAt: string;
  source: {
  schemaVersion: 2;
  sourceType: "uploaded_image";
  projectId: string;
  assetId: string;
  checksumSha256: string;
  briefVersion?: number;
  sceneRevision?: number;
  sceneRelation?: "context_only";
  revision?: {
  supersedesVersionId: string;
  expectedVersion: number;
  expectedDecisionId: string;
};
};
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
};
  requestId: string;
};

export type DeliverableListResponse = {
  ok: true;
  data: {
  deliverables: Array<{
  deliverableId: string;
  projectId: string;
  version: number;
  title: string;
  caption: string;
  status: "published";
  publishedAt: string;
  source: {
  schemaVersion: 2;
  sourceType: "uploaded_image";
  projectId: string;
  assetId: string;
  checksumSha256: string;
  briefVersion?: number;
  sceneRevision?: number;
  sceneRelation?: "context_only";
  revision?: {
  supersedesVersionId: string;
  expectedVersion: number;
  expectedDecisionId: string;
};
};
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
}>;
  hasMore: boolean;
  canPublish: boolean;
};
  requestId: string;
};

export type BrainstormRequest = {
  message: string;
  briefVersion?: number;
};

export type BrainstormResult = {
  reply: string;
  directions: Array<{
  name: string;
  concept: string;
  visualDirection: string;
  proposedDeliverable: string;
  productionSuggestion: string;
}>;
  format: "structured" | "plain_text";
  sourceBriefVersion: number;
  providerStatus: "live";
};

export type BrainstormResponse = {
  ok: true;
  data: {
  reply: string;
  directions: Array<{
  name: string;
  concept: string;
  visualDirection: string;
  proposedDeliverable: string;
  productionSuggestion: string;
}>;
  format: "structured" | "plain_text";
  sourceBriefVersion: number;
  providerStatus: "live";
};
  requestId: string;
};

export type SaveProjectBrief = {
  expectedVersion: number;
  idempotencyKey: string;
  brief: {
  schemaVersion: 1;
  objective: string;
  audience: string;
  product: string;
  format: "reel" | "poster" | "script";
  aspectRatio: "9:16" | "1:1" | "16:9";
  tone: string;
  language: "en-IN" | "hi-IN" | "kn-IN";
  facts: Array<{
  id: string;
  text: string;
}>;
  prohibitedClaims: Array<string>;
  constraints: Array<string>;
  title?: string;
  brandRequirements?: string;
  keyMessage?: string;
  channels?: Array<string>;
  references?: Array<string>;
  deadline?: string;
  notes?: string;
};
};

export type ProjectBriefResult = {
  brief: ({
  schemaVersion: 1;
  objective: string;
  audience: string;
  product: string;
  format: "reel" | "poster" | "script";
  aspectRatio: "9:16" | "1:1" | "16:9";
  tone: string;
  language: "en-IN" | "hi-IN" | "kn-IN";
  facts: Array<{
  id: string;
  text: string;
}>;
  prohibitedClaims: Array<string>;
  constraints: Array<string>;
  title?: string;
  brandRequirements?: string;
  keyMessage?: string;
  channels?: Array<string>;
  references?: Array<string>;
  deadline?: string;
  notes?: string;
} | null);
  version: number;
  savedAt: (string | null);
  canEdit: boolean;
};

export type ProjectBriefResponse = {
  ok: true;
  data: {
  brief: ({
  schemaVersion: 1;
  objective: string;
  audience: string;
  product: string;
  format: "reel" | "poster" | "script";
  aspectRatio: "9:16" | "1:1" | "16:9";
  tone: string;
  language: "en-IN" | "hi-IN" | "kn-IN";
  facts: Array<{
  id: string;
  text: string;
}>;
  prohibitedClaims: Array<string>;
  constraints: Array<string>;
  title?: string;
  brandRequirements?: string;
  keyMessage?: string;
  channels?: Array<string>;
  references?: Array<string>;
  deadline?: string;
  notes?: string;
} | null);
  version: number;
  savedAt: (string | null);
  canEdit: boolean;
};
  requestId: string;
};

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
