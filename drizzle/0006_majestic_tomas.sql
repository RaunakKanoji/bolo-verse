ALTER TABLE "processing_jobs" ADD CONSTRAINT "processing_jobs_id_project_uq" UNIQUE("id","project_id");
--> statement-breakpoint
CREATE TABLE "asset_upload_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"owner_clerk_id" text NOT NULL,
	"asset_id" uuid NOT NULL,
	"idempotency_key" text NOT NULL,
	"staging_object_key" text NOT NULL,
	"final_object_key" text NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"byte_size" bigint NOT NULL,
	"checksum_sha256" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finalized_at" timestamp with time zone,
	CONSTRAINT "asset_upload_sessions_staging_object_key_unique" UNIQUE("staging_object_key"),
	CONSTRAINT "asset_upload_sessions_final_object_key_unique" UNIQUE("final_object_key"),
	CONSTRAINT "image_upload_operation_uq" UNIQUE("project_id","owner_clerk_id","idempotency_key"),
	CONSTRAINT "image_upload_size_bounded" CHECK ("asset_upload_sessions"."byte_size" > 0 AND "asset_upload_sessions"."byte_size" <= 20971520),
	CONSTRAINT "image_upload_checksum" CHECK ("asset_upload_sessions"."checksum_sha256" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "image_upload_status_valid" CHECK ("asset_upload_sessions"."status" IN ('pending','verifying','ready','failed'))
);
--> statement-breakpoint
CREATE TABLE "image_generation_requests" (
	"job_id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"owner_clerk_id" text NOT NULL,
	"prompt" text NOT NULL,
	"model_id" text NOT NULL,
	"aspect_ratio" text NOT NULL,
	"reference_asset_id" uuid,
	"output_asset_id" uuid,
	"request_hash" text NOT NULL,
	"provider_started_at" timestamp with time zone,
	"error_message" text,
	CONSTRAINT "image_generation_prompt_bounded" CHECK (char_length("image_generation_requests"."prompt") BETWEEN 1 AND 4000),
	CONSTRAINT "image_generation_request_hash" CHECK ("image_generation_requests"."request_hash" ~ '^[a-f0-9]{64}$')
);
--> statement-breakpoint
ALTER TABLE "asset_upload_sessions" ADD CONSTRAINT "asset_upload_sessions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_upload_sessions" ADD CONSTRAINT "asset_upload_sessions_asset_id_project_id_assets_id_project_id_fk" FOREIGN KEY ("asset_id","project_id") REFERENCES "public"."assets"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_generation_requests" ADD CONSTRAINT "image_generation_requests_job_id_project_id_processing_jobs_id_project_id_fk" FOREIGN KEY ("job_id","project_id") REFERENCES "public"."processing_jobs"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_generation_requests" ADD CONSTRAINT "image_generation_requests_reference_asset_id_project_id_assets_id_project_id_fk" FOREIGN KEY ("reference_asset_id","project_id") REFERENCES "public"."assets"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_generation_requests" ADD CONSTRAINT "image_generation_requests_output_asset_id_project_id_assets_id_project_id_fk" FOREIGN KEY ("output_asset_id","project_id") REFERENCES "public"."assets"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "image_upload_expiry_idx" ON "asset_upload_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "image_generation_owner_idx" ON "image_generation_requests" USING btree ("project_id","owner_clerk_id");--> statement-breakpoint
