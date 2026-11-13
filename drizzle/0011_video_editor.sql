CREATE TABLE "video_editor_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"owner_clerk_id" text NOT NULL,
	"revision" integer NOT NULL,
	"document" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "video_draft_project_owner_uq" UNIQUE("project_id","owner_clerk_id"),
	CONSTRAINT "video_draft_revision_positive" CHECK ("video_editor_drafts"."revision" > 0),
	CONSTRAINT "video_draft_document_v1" CHECK (COALESCE("video_editor_drafts"."document"->>'schemaVersion' = '1', false))
);
--> statement-breakpoint
CREATE TABLE "video_render_requests" (
	"job_id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"owner_clerk_id" text NOT NULL,
	"draft_revision" integer NOT NULL,
	"document" jsonb NOT NULL,
	"source_snapshot" jsonb NOT NULL,
	"request_hash" text NOT NULL,
	"environment" text NOT NULL,
	"consent" text NOT NULL,
	"provider_started_at" timestamp with time zone,
	"error_message" text,
	"output_asset_id" uuid,
	CONSTRAINT "video_render_revision_positive" CHECK ("video_render_requests"."draft_revision" > 0),
	CONSTRAINT "video_render_hash" CHECK ("video_render_requests"."request_hash" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "video_render_environment" CHECK ("video_render_requests"."environment" IN ('sandbox','production')),
	CONSTRAINT "video_render_consent" CHECK ("video_render_requests"."consent" = 'shotstack-render-v1'),
	CONSTRAINT "video_render_document_v1" CHECK (COALESCE("video_render_requests"."document"->>'schemaVersion' = '1', false)),
	CONSTRAINT "video_render_sources_bounded" CHECK (jsonb_typeof("video_render_requests"."source_snapshot") = 'array' AND jsonb_array_length("video_render_requests"."source_snapshot") BETWEEN 1 AND 50)
);
--> statement-breakpoint
ALTER TABLE "video_editor_drafts" ADD CONSTRAINT "video_editor_drafts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_render_requests" ADD CONSTRAINT "video_render_requests_job_id_project_id_processing_jobs_id_project_id_fk" FOREIGN KEY ("job_id","project_id") REFERENCES "public"."processing_jobs"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_render_requests" ADD CONSTRAINT "video_render_requests_output_asset_id_project_id_assets_id_project_id_fk" FOREIGN KEY ("output_asset_id","project_id") REFERENCES "public"."assets"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "video_render_owner_idx" ON "video_render_requests" USING btree ("project_id","owner_clerk_id");--> statement-breakpoint
CREATE FUNCTION protect_video_render_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.job_id IS DISTINCT FROM OLD.job_id OR NEW.project_id IS DISTINCT FROM OLD.project_id OR NEW.owner_clerk_id IS DISTINCT FROM OLD.owner_clerk_id OR NEW.draft_revision IS DISTINCT FROM OLD.draft_revision OR NEW.document IS DISTINCT FROM OLD.document OR NEW.source_snapshot IS DISTINCT FROM OLD.source_snapshot OR NEW.request_hash IS DISTINCT FROM OLD.request_hash OR NEW.environment IS DISTINCT FROM OLD.environment OR NEW.consent IS DISTINCT FROM OLD.consent OR (OLD.provider_started_at IS NOT NULL AND NEW.provider_started_at IS DISTINCT FROM OLD.provider_started_at) OR (OLD.output_asset_id IS NOT NULL AND NEW.output_asset_id IS DISTINCT FROM OLD.output_asset_id) THEN
    RAISE EXCEPTION 'Video render source snapshot is immutable';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER video_render_snapshot_immutable BEFORE UPDATE ON video_render_requests FOR EACH ROW EXECUTE FUNCTION protect_video_render_snapshot();
