CREATE TYPE "public"."artifact_kind" AS ENUM('direction', 'script', 'storyboard', 'note', 'media_edit');--> statement-breakpoint
CREATE TYPE "public"."asset_status" AS ENUM('staging', 'verifying', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."brief_status" AS ENUM('proposed', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."grant_scope" AS ENUM('upload', 'spectator', 'watch', 'review');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('queued', 'processing', 'ready', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."locale" AS ENUM('en-IN', 'hi-IN', 'kn-IN');--> statement-breakpoint
CREATE TYPE "public"."output_status" AS ENUM('capturing', 'saving', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."project_role" AS ENUM('creator', 'editor', 'client');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('setup', 'active', 'paused', 'ended');--> statement-breakpoint
CREATE TYPE "public"."workspace_role" AS ENUM('owner', 'member');--> statement-breakpoint
CREATE TABLE "access_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"secret_hash" text NOT NULL,
	"scope" "grant_scope" NOT NULL,
	"session_id" uuid,
	"content_version_id" uuid,
	"issuer_clerk_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"max_uses" integer DEFAULT 1 NOT NULL,
	"use_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "access_grants_secret_hash_unique" UNIQUE("secret_hash"),
	CONSTRAINT "grant_resource_matches_scope" CHECK (("access_grants"."scope" IN ('upload', 'spectator') AND "access_grants"."session_id" IS NOT NULL AND "access_grants"."content_version_id" IS NULL) OR ("access_grants"."scope" IN ('watch', 'review') AND "access_grants"."content_version_id" IS NOT NULL AND "access_grants"."session_id" IS NULL)),
	CONSTRAINT "grant_uses_bounded" CHECK ("access_grants"."max_uses" > 0 AND "access_grants"."use_count" >= 0 AND "access_grants"."use_count" <= "access_grants"."max_uses"),
	CONSTRAINT "grant_hash_sha256" CHECK ("access_grants"."secret_hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "artifact_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"kind" "artifact_kind" NOT NULL,
	"version" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"source_brief_version_id" uuid,
	"source_artifact_version_id" uuid,
	"author_clerk_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "artifact_versions_id_project_uq" UNIQUE("id","project_id"),
	CONSTRAINT "artifact_version_positive" CHECK ("artifact_versions"."version" > 0),
	CONSTRAINT "artifact_payload_kind_matches" CHECK ("artifact_versions"."payload"->>'kind' = "artifact_versions"."kind"::text)
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"owner_clerk_id" text,
	"upload_grant_id" uuid,
	"object_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"byte_size" bigint NOT NULL,
	"width" integer,
	"height" integer,
	"duration_seconds" double precision,
	"checksum_sha256" text,
	"status" "asset_status" DEFAULT 'staging' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assets_object_key_unique" UNIQUE("object_key"),
	CONSTRAINT "assets_id_project_uq" UNIQUE("id","project_id"),
	CONSTRAINT "asset_owner_present" CHECK ("assets"."owner_clerk_id" IS NOT NULL OR "assets"."upload_grant_id" IS NOT NULL),
	CONSTRAINT "asset_size_nonnegative" CHECK ("assets"."byte_size" >= 0),
	CONSTRAINT "asset_dimensions_positive" CHECK (("assets"."width" IS NULL OR "assets"."width" > 0) AND ("assets"."height" IS NULL OR "assets"."height" > 0)),
	CONSTRAINT "asset_duration_nonnegative" CHECK ("assets"."duration_seconds" IS NULL OR "assets"."duration_seconds" >= 0)
);
--> statement-breakpoint
CREATE TABLE "brief_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"author_clerk_id" text NOT NULL,
	"status" "brief_status" DEFAULT 'proposed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brief_versions_project_version_uq" UNIQUE("project_id","version"),
	CONSTRAINT "brief_versions_id_project_uq" UNIQUE("id","project_id"),
	CONSTRAINT "brief_version_positive" CHECK ("brief_versions"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "claim_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"content_version_id" uuid NOT NULL,
	"brief_version_id" uuid NOT NULL,
	"transcript" text,
	"issues" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"model" text,
	"idempotency_key" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "claim_checks_operation_uq" UNIQUE("project_id","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "command_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"request_id" uuid NOT NULL,
	"actor_clerk_id" text NOT NULL,
	"transcript" text,
	"action" text NOT NULL,
	"result" jsonb NOT NULL,
	"timings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"fallback" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "command_logs_request_uq" UNIQUE("session_id","request_id")
);
--> statement-breakpoint
CREATE TABLE "content_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"source_snapshot" jsonb NOT NULL,
	"source_session_id" uuid,
	"source_scene_revision" integer,
	"source_artifact_version_id" uuid,
	"brief_version_id" uuid,
	"asset_id" uuid,
	"media_metadata" jsonb,
	"status" "output_status" DEFAULT 'capturing' NOT NULL,
	"author_clerk_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_versions_id_project_uq" UNIQUE("id","project_id"),
	CONSTRAINT "content_versions_project_version_uq" UNIQUE("project_id","version"),
	CONSTRAINT "content_version_positive" CHECK ("content_versions"."version" > 0),
	CONSTRAINT "content_ready_has_media" CHECK ("content_versions"."status" <> 'ready' OR ("content_versions"."asset_id" IS NOT NULL AND "content_versions"."media_metadata" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "processing_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"provider_job_id" text,
	"status" "job_status" DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"lease_expires_at" timestamp with time zone,
	"result" jsonb,
	"failure_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "processing_jobs_operation_uq" UNIQUE("project_id","kind","idempotency_key"),
	CONSTRAINT "job_attempts_nonnegative" CHECK ("processing_jobs"."attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"source_image_asset_id" uuid NOT NULL,
	"cutout_asset_id" uuid,
	"name" text NOT NULL,
	"cutout_status" text DEFAULT 'not_requested' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_id_project_uq" UNIQUE("id","project_id")
);
--> statement-breakpoint
CREATE TABLE "project_members" (
	"project_id" uuid NOT NULL,
	"clerk_user_id" text NOT NULL,
	"role" "project_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_members_project_id_clerk_user_id_pk" PRIMARY KEY("project_id","clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"objective" text NOT NULL,
	"created_by_clerk_id" text NOT NULL,
	"sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit_buckets" (
	"key_hash" text PRIMARY KEY NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "rate_limit_count_nonnegative" CHECK ("rate_limit_buckets"."count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "review_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"content_version_id" uuid NOT NULL,
	"reviewer_clerk_id" text NOT NULL,
	"timecode_seconds" double precision,
	"comment" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comment_timecode_nonnegative" CHECK ("review_comments"."timecode_seconds" IS NULL OR "review_comments"."timecode_seconds" >= 0)
);
--> statement-breakpoint
CREATE TABLE "review_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"content_version_id" uuid NOT NULL,
	"brief_version_id" uuid,
	"reviewer_clerk_id" text NOT NULL,
	"decision" text NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_decision_valid" CHECK ("review_decisions"."decision" IN ('approved', 'changes_requested'))
);
--> statement-breakpoint
CREATE TABLE "scene_state" (
	"session_id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"document" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scene_revision_nonnegative" CHECK ("scene_state"."revision" >= 0)
);
--> statement-breakpoint
CREATE TABLE "studio_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"creator_clerk_id" text NOT NULL,
	"locale" "locale" DEFAULT 'en-IN' NOT NULL,
	"consent_version" text,
	"consent_at" timestamp with time zone,
	"status" "session_status" DEFAULT 'setup' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "studio_sessions_id_project_uq" UNIQUE("id","project_id"),
	CONSTRAINT "session_consent_pair" CHECK (("studio_sessions"."consent_version" IS NULL) = ("studio_sessions"."consent_at" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "upload_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"finalized_at" timestamp with time zone NOT NULL,
	"first_render_acknowledged_at" timestamp with time zone,
	"uploader_processing_ms" double precision,
	"uploader_upload_ms" double precision,
	"studio_notification_to_render_ms" double precision,
	CONSTRAINT "upload_events_session_asset_uq" UNIQUE("session_id","asset_id")
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"workspace_id" uuid NOT NULL,
	"clerk_user_id" text NOT NULL,
	"role" "workspace_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_members_workspace_id_clerk_user_id_pk" PRIMARY KEY("workspace_id","clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"personal_owner_clerk_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspaces_personal_owner_clerk_id_unique" UNIQUE("personal_owner_clerk_id")
);
--> statement-breakpoint
ALTER TABLE "access_grants" ADD CONSTRAINT "access_grants_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_grants" ADD CONSTRAINT "access_grants_session_id_project_id_studio_sessions_id_project_id_fk" FOREIGN KEY ("session_id","project_id") REFERENCES "public"."studio_sessions"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_grants" ADD CONSTRAINT "access_grants_content_version_id_project_id_content_versions_id_project_id_fk" FOREIGN KEY ("content_version_id","project_id") REFERENCES "public"."content_versions"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact_versions" ADD CONSTRAINT "artifact_versions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact_versions" ADD CONSTRAINT "artifact_versions_source_brief_version_id_project_id_brief_versions_id_project_id_fk" FOREIGN KEY ("source_brief_version_id","project_id") REFERENCES "public"."brief_versions"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact_versions" ADD CONSTRAINT "artifact_versions_source_artifact_version_id_project_id_artifact_versions_id_project_id_fk" FOREIGN KEY ("source_artifact_version_id","project_id") REFERENCES "public"."artifact_versions"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_upload_grant_id_access_grants_id_fk" FOREIGN KEY ("upload_grant_id") REFERENCES "public"."access_grants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brief_versions" ADD CONSTRAINT "brief_versions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_checks" ADD CONSTRAINT "claim_checks_content_version_id_project_id_content_versions_id_project_id_fk" FOREIGN KEY ("content_version_id","project_id") REFERENCES "public"."content_versions"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_checks" ADD CONSTRAINT "claim_checks_brief_version_id_project_id_brief_versions_id_project_id_fk" FOREIGN KEY ("brief_version_id","project_id") REFERENCES "public"."brief_versions"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "command_logs" ADD CONSTRAINT "command_logs_session_id_project_id_studio_sessions_id_project_id_fk" FOREIGN KEY ("session_id","project_id") REFERENCES "public"."studio_sessions"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_source_session_id_project_id_studio_sessions_id_project_id_fk" FOREIGN KEY ("source_session_id","project_id") REFERENCES "public"."studio_sessions"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_source_artifact_version_id_project_id_artifact_versions_id_project_id_fk" FOREIGN KEY ("source_artifact_version_id","project_id") REFERENCES "public"."artifact_versions"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_brief_version_id_project_id_brief_versions_id_project_id_fk" FOREIGN KEY ("brief_version_id","project_id") REFERENCES "public"."brief_versions"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_asset_id_project_id_assets_id_project_id_fk" FOREIGN KEY ("asset_id","project_id") REFERENCES "public"."assets"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processing_jobs" ADD CONSTRAINT "processing_jobs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_source_image_asset_id_project_id_assets_id_project_id_fk" FOREIGN KEY ("source_image_asset_id","project_id") REFERENCES "public"."assets"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_cutout_asset_id_project_id_assets_id_project_id_fk" FOREIGN KEY ("cutout_asset_id","project_id") REFERENCES "public"."assets"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_content_version_id_project_id_content_versions_id_project_id_fk" FOREIGN KEY ("content_version_id","project_id") REFERENCES "public"."content_versions"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_content_version_id_project_id_content_versions_id_project_id_fk" FOREIGN KEY ("content_version_id","project_id") REFERENCES "public"."content_versions"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_brief_version_id_project_id_brief_versions_id_project_id_fk" FOREIGN KEY ("brief_version_id","project_id") REFERENCES "public"."brief_versions"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scene_state" ADD CONSTRAINT "scene_state_session_id_project_id_studio_sessions_id_project_id_fk" FOREIGN KEY ("session_id","project_id") REFERENCES "public"."studio_sessions"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_sessions" ADD CONSTRAINT "studio_sessions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_events" ADD CONSTRAINT "upload_events_session_id_project_id_studio_sessions_id_project_id_fk" FOREIGN KEY ("session_id","project_id") REFERENCES "public"."studio_sessions"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_events" ADD CONSTRAINT "upload_events_asset_id_project_id_assets_id_project_id_fk" FOREIGN KEY ("asset_id","project_id") REFERENCES "public"."assets"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_grants_project_idx" ON "access_grants" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "artifact_versions_project_kind_idx" ON "artifact_versions" USING btree ("project_id","kind");--> statement-breakpoint
CREATE INDEX "assets_project_status_idx" ON "assets" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "claim_checks_output_idx" ON "claim_checks" USING btree ("content_version_id");--> statement-breakpoint
CREATE INDEX "command_logs_project_idx" ON "command_logs" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "processing_jobs_project_status_idx" ON "processing_jobs" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "products_project_idx" ON "products" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_members_user_idx" ON "project_members" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "projects_workspace_idx" ON "projects" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "rate_limit_buckets_expiry_idx" ON "rate_limit_buckets" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "review_comments_content_idx" ON "review_comments" USING btree ("content_version_id");--> statement-breakpoint
CREATE INDEX "review_decisions_content_idx" ON "review_decisions" USING btree ("content_version_id");--> statement-breakpoint
CREATE INDEX "scene_state_project_idx" ON "scene_state" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "studio_sessions_project_idx" ON "studio_sessions" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "upload_events_project_idx" ON "upload_events" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "workspace_members_user_idx" ON "workspace_members" USING btree ("clerk_user_id");