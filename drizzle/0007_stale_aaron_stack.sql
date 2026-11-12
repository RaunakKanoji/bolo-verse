ALTER TABLE "asset_upload_sessions" ADD COLUMN "staging_deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "image_generation_requests" ADD COLUMN "output_deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "asset_upload_sessions" ADD CONSTRAINT "image_upload_asset_uq" UNIQUE("asset_id");--> statement-breakpoint
ALTER TABLE "asset_upload_sessions" ADD CONSTRAINT "image_upload_mime_supported" CHECK ("asset_upload_sessions"."mime_type" IN ('image/png','image/jpeg','image/webp'));--> statement-breakpoint
ALTER TABLE "asset_upload_sessions" ADD CONSTRAINT "image_upload_keys_distinct" CHECK ("asset_upload_sessions"."staging_object_key" <> "asset_upload_sessions"."final_object_key");--> statement-breakpoint
ALTER TABLE "asset_upload_sessions" ADD CONSTRAINT "image_upload_finalized_status" CHECK (("asset_upload_sessions"."status" = 'ready') = ("asset_upload_sessions"."finalized_at" IS NOT NULL));