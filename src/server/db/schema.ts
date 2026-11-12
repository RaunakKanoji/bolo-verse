import { sql } from "drizzle-orm";
import {
  bigint, boolean, check, doublePrecision, foreignKey, index, integer,
  jsonb, pgEnum, pgTable, primaryKey, text, timestamp, unique, uuid,
  type PgTableExtraConfigValue,
} from "drizzle-orm/pg-core";
import type {
  ArtifactPayload, BriefPayload, ClaimIssue, OutputMetadata,
  OutputSourceSnapshot, SceneDocument,
} from "@/lib/contracts";

// UUIDs identify application resources; Clerk subjects deliberately remain text.
const id = () => uuid("id").defaultRandom().primaryKey();
const createdAt = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

export const workspaceRole = pgEnum("workspace_role", ["owner", "member"]);
export const projectRole = pgEnum("project_role", ["creator", "editor", "client"]);
export const artifactKind = pgEnum("artifact_kind", ["direction", "script", "storyboard", "note", "media_edit"]);
export const briefStatus = pgEnum("brief_status", ["proposed", "approved", "rejected"]);
export const sessionStatus = pgEnum("session_status", ["setup", "active", "paused", "ended"]);
export const assetStatus = pgEnum("asset_status", ["staging", "verifying", "ready", "failed"]);
export const outputStatus = pgEnum("output_status", ["capturing", "saving", "ready", "failed"]);
export const grantScope = pgEnum("grant_scope", ["upload", "spectator", "watch", "review"]);
export const jobStatus = pgEnum("job_status", ["queued", "processing", "ready", "failed", "cancelled"]);
export const locale = pgEnum("locale", ["en-IN", "hi-IN", "kn-IN"]);

export const workspaces = pgTable("workspaces", {
  id: id(),
  name: text("name").notNull(),
  personalOwnerClerkId: text("personal_owner_clerk_id").notNull().unique(),
  createdAt: createdAt(),
});

export const workspaceMembers = pgTable("workspace_members", {
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  clerkUserId: text("clerk_user_id").notNull(),
  role: workspaceRole("role").notNull(),
  createdAt: createdAt(),
}, (table) => [
  primaryKey({ columns: [table.workspaceId, table.clerkUserId] }),
  index("workspace_members_user_idx").on(table.clerkUserId),
]);

export const projects = pgTable("projects", {
  id: id(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  objective: text("objective").notNull(),
  createdByClerkId: text("created_by_clerk_id").notNull(),
  sample: boolean("sample").default(false).notNull(),
  createdAt: createdAt(),
}, (table) => [index("projects_workspace_idx").on(table.workspaceId)]);

export const projectMembers = pgTable("project_members", {
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  clerkUserId: text("clerk_user_id").notNull(),
  role: projectRole("role").notNull(),
  createdAt: createdAt(),
}, (table) => [
  primaryKey({ columns: [table.projectId, table.clerkUserId] }),
  index("project_members_user_idx").on(table.clerkUserId),
]);

export const briefVersions = pgTable("brief_versions", {
  id: id(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "restrict" }),
  version: integer("version").notNull(),
  payload: jsonb("payload").$type<BriefPayload>().notNull(),
  authorClerkId: text("author_clerk_id").notNull(),
  status: briefStatus("status").default("proposed").notNull(),
  createdAt: createdAt(),
}, (table) => [
  unique("brief_versions_project_version_uq").on(table.projectId, table.version),
  unique("brief_versions_id_project_uq").on(table.id, table.projectId),
  check("brief_version_positive", sql`${table.version} > 0`),
]);

export const artifactVersions = pgTable("artifact_versions", {
  id: id(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "restrict" }),
  kind: artifactKind("kind").notNull(),
  version: integer("version").notNull(),
  payload: jsonb("payload").$type<ArtifactPayload>().notNull(),
  sourceBriefVersionId: uuid("source_brief_version_id"),
  sourceArtifactVersionId: uuid("source_artifact_version_id"),
  authorClerkId: text("author_clerk_id").notNull(),
  createdAt: createdAt(),
}, (table) => [
  unique("artifact_versions_id_project_uq").on(table.id, table.projectId),
  index("artifact_versions_project_kind_idx").on(table.projectId, table.kind),
  foreignKey({ columns: [table.sourceBriefVersionId, table.projectId], foreignColumns: [briefVersions.id, briefVersions.projectId] }),
  foreignKey({ columns: [table.sourceArtifactVersionId, table.projectId], foreignColumns: [table.id, table.projectId] }),
  check("artifact_version_positive", sql`${table.version} > 0`),
  check("artifact_payload_kind_matches", sql`${table.payload}->>'kind' = ${table.kind}::text`),
]);

export const studioSessions = pgTable("studio_sessions", {
  id: id(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "restrict" }),
  creatorClerkId: text("creator_clerk_id").notNull(),
  locale: locale("locale").default("en-IN").notNull(),
  consentVersion: text("consent_version"),
  consentAt: timestamp("consent_at", { withTimezone: true }),
  status: sessionStatus("status").default("setup").notNull(),
  createdAt: createdAt(),
}, (table) => [
  unique("studio_sessions_id_project_uq").on(table.id, table.projectId),
  index("studio_sessions_project_idx").on(table.projectId),
  check("session_consent_pair", sql`(${table.consentVersion} IS NULL) = (${table.consentAt} IS NULL)`),
]);

export const assets = pgTable("assets", {
  id: id(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "restrict" }),
  ownerClerkId: text("owner_clerk_id"),
  uploadGrantId: uuid("upload_grant_id"),
  objectKey: text("object_key").notNull().unique(),
  mimeType: text("mime_type").notNull(),
  byteSize: bigint("byte_size", { mode: "number" }).notNull(),
  width: integer("width"),
  height: integer("height"),
  durationSeconds: doublePrecision("duration_seconds"),
  checksumSha256: text("checksum_sha256"),
  status: assetStatus("status").default("staging").notNull(),
  createdAt: createdAt(),
}, (table): PgTableExtraConfigValue[] => [
  unique("assets_id_project_uq").on(table.id, table.projectId),
  index("assets_project_status_idx").on(table.projectId, table.status),
  foreignKey({ columns: [table.uploadGrantId, table.projectId], foreignColumns: [accessGrants.id, accessGrants.projectId] }),
  check("asset_owner_present", sql`${table.ownerClerkId} IS NOT NULL OR ${table.uploadGrantId} IS NOT NULL`),
  check("asset_size_nonnegative", sql`${table.byteSize} >= 0`),
  check("asset_dimensions_positive", sql`(${table.width} IS NULL OR ${table.width} > 0) AND (${table.height} IS NULL OR ${table.height} > 0)`),
  check("asset_duration_nonnegative", sql`${table.durationSeconds} IS NULL OR ${table.durationSeconds} >= 0`),
]);

export const products = pgTable("products", {
  id: id(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "restrict" }),
  sourceImageAssetId: uuid("source_image_asset_id").notNull(),
  cutoutAssetId: uuid("cutout_asset_id"),
  name: text("name").notNull(),
  cutoutStatus: text("cutout_status", { enum: ["not_requested", "processing", "ready", "failed"] }).default("not_requested").notNull(),
  createdAt: createdAt(),
}, (table) => [
  unique("products_id_project_uq").on(table.id, table.projectId),
  index("products_project_idx").on(table.projectId),
  foreignKey({ columns: [table.sourceImageAssetId, table.projectId], foreignColumns: [assets.id, assets.projectId] }),
  foreignKey({ columns: [table.cutoutAssetId, table.projectId], foreignColumns: [assets.id, assets.projectId] }),
]);

export const sceneState = pgTable("scene_state", {
  sessionId: uuid("session_id").primaryKey(),
  projectId: uuid("project_id").notNull(),
  revision: integer("revision").default(0).notNull(),
  document: jsonb("document").$type<SceneDocument>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.sessionId, table.projectId], foreignColumns: [studioSessions.id, studioSessions.projectId] }),
  index("scene_state_project_idx").on(table.projectId),
  check("scene_revision_nonnegative", sql`${table.revision} >= 0`),
]);

export const contentVersions = pgTable("content_versions", {
  id: id(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "restrict" }),
  version: integer("version").notNull(),
  sourceSnapshot: jsonb("source_snapshot").$type<OutputSourceSnapshot>().notNull(),
  sourceSessionId: uuid("source_session_id"),
  sourceSceneRevision: integer("source_scene_revision"),
  sourceArtifactVersionId: uuid("source_artifact_version_id"),
  briefVersionId: uuid("brief_version_id"),
  assetId: uuid("asset_id"),
  mediaMetadata: jsonb("media_metadata").$type<OutputMetadata>(),
  status: outputStatus("status").default("capturing").notNull(),
  authorClerkId: text("author_clerk_id").notNull(),
  createdAt: createdAt(),
}, (table) => [
  unique("content_versions_id_project_uq").on(table.id, table.projectId),
  unique("content_versions_project_version_uq").on(table.projectId, table.version),
  foreignKey({ columns: [table.sourceSessionId, table.projectId], foreignColumns: [studioSessions.id, studioSessions.projectId] }),
  foreignKey({ columns: [table.sourceArtifactVersionId, table.projectId], foreignColumns: [artifactVersions.id, artifactVersions.projectId] }),
  foreignKey({ columns: [table.briefVersionId, table.projectId], foreignColumns: [briefVersions.id, briefVersions.projectId] }),
  foreignKey({ columns: [table.assetId, table.projectId], foreignColumns: [assets.id, assets.projectId] }),
  check("content_version_positive", sql`${table.version} > 0`),
  check("content_ready_has_media", sql`${table.status} <> 'ready' OR (${table.assetId} IS NOT NULL AND ${table.mediaMetadata} IS NOT NULL)`),
]);

export const reviewComments = pgTable("review_comments", {
  id: id(),
  projectId: uuid("project_id").notNull(),
  contentVersionId: uuid("content_version_id").notNull(),
  reviewerClerkId: text("reviewer_clerk_id").notNull(),
  timecodeSeconds: doublePrecision("timecode_seconds"),
  comment: text("comment").notNull(),
  createdAt: createdAt(),
}, (table) => [
  foreignKey({ columns: [table.contentVersionId, table.projectId], foreignColumns: [contentVersions.id, contentVersions.projectId] }),
  index("review_comments_content_idx").on(table.contentVersionId),
  check("comment_timecode_nonnegative", sql`${table.timecodeSeconds} IS NULL OR ${table.timecodeSeconds} >= 0`),
]);

export const reviewDecisions = pgTable("review_decisions", {
  id: id(),
  projectId: uuid("project_id").notNull(),
  contentVersionId: uuid("content_version_id").notNull(),
  briefVersionId: uuid("brief_version_id"),
  reviewerClerkId: text("reviewer_clerk_id").notNull(),
  decision: text("decision", { enum: ["approved", "changes_requested"] }).notNull(),
  reason: text("reason"),
  createdAt: createdAt(),
}, (table) => [
  foreignKey({ columns: [table.contentVersionId, table.projectId], foreignColumns: [contentVersions.id, contentVersions.projectId] }),
  foreignKey({ columns: [table.briefVersionId, table.projectId], foreignColumns: [briefVersions.id, briefVersions.projectId] }),
  index("review_decisions_content_idx").on(table.contentVersionId),
  check("review_decision_valid", sql`${table.decision} IN ('approved', 'changes_requested')`),
]);

export const accessGrants = pgTable("access_grants", {
  id: id(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "restrict" }),
  secretHash: text("secret_hash").notNull().unique(),
  scope: grantScope("scope").notNull(),
  sessionId: uuid("session_id"),
  contentVersionId: uuid("content_version_id"),
  issuerClerkId: text("issuer_clerk_id").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  maxUses: integer("max_uses").default(1).notNull(),
  useCount: integer("use_count").default(0).notNull(),
  createdAt: createdAt(),
}, (table) => [
  unique("access_grants_id_project_uq").on(table.id, table.projectId),
  index("access_grants_project_idx").on(table.projectId),
  foreignKey({ columns: [table.sessionId, table.projectId], foreignColumns: [studioSessions.id, studioSessions.projectId] }),
  foreignKey({ columns: [table.contentVersionId, table.projectId], foreignColumns: [contentVersions.id, contentVersions.projectId] }),
  check("grant_resource_matches_scope", sql`(${table.scope} IN ('upload', 'spectator') AND ${table.sessionId} IS NOT NULL AND ${table.contentVersionId} IS NULL) OR (${table.scope} IN ('watch', 'review') AND ${table.contentVersionId} IS NOT NULL AND ${table.sessionId} IS NULL)`),
  check("grant_uses_bounded", sql`${table.maxUses} > 0 AND ${table.useCount} >= 0 AND ${table.useCount} <= ${table.maxUses}`),
  check("grant_hash_sha256", sql`${table.secretHash} ~ '^[0-9a-f]{64}$'`),
]);

type CommandLogResult = { status: "pending" | "applied" | "rejected"; revision?: number; errorCode?: string };
type CommandTimings = { sttMs?: number; interpretationMs?: number; executionMs?: number; ttsMs?: number };
export const commandLogs = pgTable("command_logs", {
  id: id(),
  projectId: uuid("project_id").notNull(),
  sessionId: uuid("session_id").notNull(),
  requestId: text("request_id").notNull(),
  actorClerkId: text("actor_clerk_id").notNull(),
  transcript: text("transcript"),
  action: text("action").notNull(),
  result: jsonb("result").$type<CommandLogResult>().notNull(),
  timings: jsonb("timings").$type<CommandTimings>().notNull().default({}),
  fallback: boolean("fallback").default(false).notNull(),
  createdAt: createdAt(),
}, (table) => [
  foreignKey({ columns: [table.sessionId, table.projectId], foreignColumns: [studioSessions.id, studioSessions.projectId] }),
  unique("command_logs_request_uq").on(table.sessionId, table.requestId),
  check("command_request_id_bounded", sql`char_length(${table.requestId}) BETWEEN 1 AND 128`),
  index("command_logs_project_idx").on(table.projectId),
]);

export const claimChecks = pgTable("claim_checks", {
  id: id(),
  projectId: uuid("project_id").notNull(),
  contentVersionId: uuid("content_version_id").notNull(),
  briefVersionId: uuid("brief_version_id").notNull(),
  transcript: text("transcript"),
  issues: jsonb("issues").$type<ClaimIssue[]>(),
  status: text("status", { enum: ["pending", "complete", "unavailable", "needs_review", "failed"] }).default("pending").notNull(),
  model: text("model"),
  idempotencyKey: text("idempotency_key").notNull(),
  createdAt: createdAt(),
}, (table) => [
  foreignKey({ columns: [table.contentVersionId, table.projectId], foreignColumns: [contentVersions.id, contentVersions.projectId] }),
  foreignKey({ columns: [table.briefVersionId, table.projectId], foreignColumns: [briefVersions.id, briefVersions.projectId] }),
  unique("claim_checks_operation_uq").on(table.projectId, table.idempotencyKey),
  check("claim_check_idempotency_key_bounded", sql`char_length(${table.idempotencyKey}) BETWEEN 1 AND 128`),
  index("claim_checks_output_idx").on(table.contentVersionId),
]);

type ProcessingResult = { assetId?: string; artifactVersionId?: string; contentVersionId?: string };
export const processingJobs = pgTable("processing_jobs", {
  id: id(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "restrict" }),
  kind: text("kind", { enum: ["render", "claim_check", "cutout"] }).notNull(),
  idempotencyKey: text("idempotency_key").notNull(),
  providerJobId: text("provider_job_id"),
  status: jobStatus("status").default("queued").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
  result: jsonb("result").$type<ProcessingResult>(),
  failureCode: text("failure_code"),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique("processing_jobs_operation_uq").on(table.projectId, table.kind, table.idempotencyKey),
  check("job_idempotency_key_bounded", sql`char_length(${table.idempotencyKey}) BETWEEN 1 AND 128`),
  index("processing_jobs_project_status_idx").on(table.projectId, table.status),
  check("job_attempts_nonnegative", sql`${table.attempts} >= 0`),
]);

export const uploadEvents = pgTable("upload_events", {
  id: id(),
  projectId: uuid("project_id").notNull(),
  sessionId: uuid("session_id").notNull(),
  assetId: uuid("asset_id").notNull(),
  finalizedAt: timestamp("finalized_at", { withTimezone: true }).notNull(),
  firstRenderAcknowledgedAt: timestamp("first_render_acknowledged_at", { withTimezone: true }),
  uploaderProcessingMs: doublePrecision("uploader_processing_ms"),
  uploaderUploadMs: doublePrecision("uploader_upload_ms"),
  studioNotificationToRenderMs: doublePrecision("studio_notification_to_render_ms"),
}, (table) => [
  foreignKey({ columns: [table.sessionId, table.projectId], foreignColumns: [studioSessions.id, studioSessions.projectId] }),
  foreignKey({ columns: [table.assetId, table.projectId], foreignColumns: [assets.id, assets.projectId] }),
  unique("upload_events_session_asset_uq").on(table.sessionId, table.assetId),
  index("upload_events_project_idx").on(table.projectId),
]);

// No rate-limit endpoint exists in M0; later features must increment this row atomically.
export const rateLimitBuckets = pgTable("rate_limit_buckets", {
  keyHash: text("key_hash").primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").default(0).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, (table) => [
  index("rate_limit_buckets_expiry_idx").on(table.expiresAt),
  check("rate_limit_count_nonnegative", sql`${table.count} >= 0`),
]);
