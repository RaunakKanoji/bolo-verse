ALTER TABLE "assets" DROP CONSTRAINT "assets_upload_grant_id_access_grants_id_fk";
--> statement-breakpoint
ALTER TABLE "claim_checks" ALTER COLUMN "idempotency_key" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "command_logs" ALTER COLUMN "request_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "processing_jobs" ALTER COLUMN "idempotency_key" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "access_grants" ADD CONSTRAINT "access_grants_id_project_uq" UNIQUE("id","project_id");--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_upload_grant_id_project_id_access_grants_id_project_id_fk" FOREIGN KEY ("upload_grant_id","project_id") REFERENCES "public"."access_grants"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_checks" ADD CONSTRAINT "claim_check_idempotency_key_bounded" CHECK (char_length("claim_checks"."idempotency_key") BETWEEN 1 AND 128);--> statement-breakpoint
ALTER TABLE "command_logs" ADD CONSTRAINT "command_request_id_bounded" CHECK (char_length("command_logs"."request_id") BETWEEN 1 AND 128);--> statement-breakpoint
ALTER TABLE "processing_jobs" ADD CONSTRAINT "job_idempotency_key_bounded" CHECK (char_length("processing_jobs"."idempotency_key") BETWEEN 1 AND 128);
