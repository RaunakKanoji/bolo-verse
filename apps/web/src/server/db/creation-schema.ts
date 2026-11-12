import { sql } from "drizzle-orm";
import { bigint, check, foreignKey, index, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { assets, processingJobs, projects } from "./schema";

const time = (name: string) => timestamp(name, { withTimezone: true });
export const assetUploadSessions = pgTable("asset_upload_sessions", {
  id: uuid("id").defaultRandom().primaryKey(), projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "restrict" }),
  ownerClerkId: text("owner_clerk_id").notNull(), assetId: uuid("asset_id").notNull(),
  idempotencyKey: text("idempotency_key").notNull(), stagingObjectKey: text("staging_object_key").notNull().unique(), finalObjectKey: text("final_object_key").notNull().unique(),
  fileName: text("file_name").notNull(), mimeType: text("mime_type").notNull(), byteSize: bigint("byte_size", { mode: "number" }).notNull(), checksumSha256: text("checksum_sha256").notNull(),
  status: text("status", { enum: ["pending", "verifying", "ready", "failed"] }).default("pending").notNull(),
  expiresAt: time("expires_at").notNull(), createdAt: time("created_at").defaultNow().notNull(), updatedAt: time("updated_at").defaultNow().notNull(), finalizedAt: time("finalized_at"), stagingDeletedAt: time("staging_deleted_at"), finalDeletedAt: time("final_deleted_at"),
}, (table) => [
  unique("image_upload_operation_uq").on(table.projectId, table.ownerClerkId, table.idempotencyKey),
  foreignKey({ columns: [table.assetId, table.projectId], foreignColumns: [assets.id, assets.projectId] }),
  unique("image_upload_asset_uq").on(table.assetId),
  check("image_upload_mime_supported", sql`${table.mimeType} IN ('image/png','image/jpeg','image/webp')`),
  check("image_upload_keys_distinct", sql`${table.stagingObjectKey} <> ${table.finalObjectKey}`),
  check("image_upload_finalized_status", sql`(${table.status} = 'ready') = (${table.finalizedAt} IS NOT NULL)`),
  index("image_upload_expiry_idx").on(table.expiresAt),
  check("image_upload_size_bounded", sql`${table.byteSize} > 0 AND ${table.byteSize} <= 20971520`),
  check("image_upload_checksum", sql`${table.checksumSha256} ~ '^[a-f0-9]{64}$'`),
  check("image_upload_status_valid", sql`${table.status} IN ('pending','verifying','ready','failed')`),
]);

export const imageGenerationRequests = pgTable("image_generation_requests", {
  jobId: uuid("job_id").primaryKey(), projectId: uuid("project_id").notNull(), ownerClerkId: text("owner_clerk_id").notNull(),
  prompt: text("prompt").notNull(), modelId: text("model_id").notNull(), aspectRatio: text("aspect_ratio").notNull(),
  referenceAssetId: uuid("reference_asset_id"), outputAssetId: uuid("output_asset_id"), requestHash: text("request_hash").notNull(),
  providerStartedAt: time("provider_started_at"), errorMessage: text("error_message"), outputDeletedAt: time("output_deleted_at"),
}, (table) => [
  foreignKey({ columns: [table.jobId, table.projectId], foreignColumns: [processingJobs.id, processingJobs.projectId] }),
  foreignKey({ columns: [table.referenceAssetId, table.projectId], foreignColumns: [assets.id, assets.projectId] }),
  foreignKey({ columns: [table.outputAssetId, table.projectId], foreignColumns: [assets.id, assets.projectId] }),
  index("image_generation_owner_idx").on(table.projectId, table.ownerClerkId),
  check("image_generation_prompt_bounded", sql`char_length(${table.prompt}) BETWEEN 1 AND 4000`),
  check("image_generation_request_hash", sql`${table.requestHash} ~ '^[a-f0-9]{64}$'`),
]);
