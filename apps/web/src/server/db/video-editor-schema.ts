import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import type { VideoEditorDocument } from "@/lib/contracts/video-editor";
import { assets, processingJobs, projects } from "./schema";
export type VideoEditorSourceSnapshot = {
  id: string;
  projectId: string;
  objectKey: string;
  mimeType: string;
  byteSize: number;
  checksumSha256: string;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
};
const time = (name: string) => timestamp(name, { withTimezone: true });
export const videoEditorDrafts = pgTable(
  "video_editor_drafts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "restrict" }),
    ownerClerkId: text("owner_clerk_id").notNull(),
    revision: integer("revision").notNull(),
    document: jsonb("document").$type<VideoEditorDocument>().notNull(),
    createdAt: time("created_at").defaultNow().notNull(),
    updatedAt: time("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique("video_draft_project_owner_uq").on(table.projectId, table.ownerClerkId),
    check("video_draft_revision_positive", sql`${table.revision} > 0`),
    check(
      "video_draft_document_v1",
      sql`COALESCE(${table.document}->>'schemaVersion' = '1', false)`,
    ),
  ],
);
export const videoRenderRequests = pgTable(
  "video_render_requests",
  {
    jobId: uuid("job_id").primaryKey(),
    projectId: uuid("project_id").notNull(),
    ownerClerkId: text("owner_clerk_id").notNull(),
    draftRevision: integer("draft_revision").notNull(),
    document: jsonb("document").$type<VideoEditorDocument>().notNull(),
    sourceSnapshot: jsonb("source_snapshot").$type<VideoEditorSourceSnapshot[]>().notNull(),
    requestHash: text("request_hash").notNull(),
    environment: text("environment", { enum: ["sandbox", "production"] }).notNull(),
    consent: text("consent").notNull(),
    providerStartedAt: time("provider_started_at"),
    errorMessage: text("error_message"),
    outputAssetId: uuid("output_asset_id"),
  },
  (table) => [
    foreignKey({
      columns: [table.jobId, table.projectId],
      foreignColumns: [processingJobs.id, processingJobs.projectId],
    }),
    foreignKey({
      columns: [table.outputAssetId, table.projectId],
      foreignColumns: [assets.id, assets.projectId],
    }),
    index("video_render_owner_idx").on(table.projectId, table.ownerClerkId),
    check("video_render_revision_positive", sql`${table.draftRevision} > 0`),
    check("video_render_hash", sql`${table.requestHash} ~ '^[a-f0-9]{64}$'`),
    check("video_render_environment", sql`${table.environment} IN ('sandbox','production')`),
    check("video_render_consent", sql`${table.consent} = 'shotstack-render-v1'`),
    check(
      "video_render_document_v1",
      sql`COALESCE(${table.document}->>'schemaVersion' = '1', false)`,
    ),
    check(
      "video_render_sources_bounded",
      sql`jsonb_typeof(${table.sourceSnapshot}) = 'array' AND jsonb_array_length(${table.sourceSnapshot}) BETWEEN 1 AND 50`,
    ),
  ],
);
