ALTER TABLE "access_grants" ADD COLUMN "reviewer_clerk_id" text;--> statement-breakpoint
ALTER TABLE "review_comments" ADD COLUMN "review_grant_id" uuid;--> statement-breakpoint
ALTER TABLE "review_decisions" ADD COLUMN "review_grant_id" uuid;--> statement-breakpoint
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_review_grant_id_project_id_access_grants_id_project_id_fk" FOREIGN KEY ("review_grant_id","project_id") REFERENCES "public"."access_grants"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_review_grant_id_project_id_access_grants_id_project_id_fk" FOREIGN KEY ("review_grant_id","project_id") REFERENCES "public"."access_grants"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "review_active_version_grant_uq" ON "access_grants" USING btree ("content_version_id") WHERE "access_grants"."scope" = 'review' AND "access_grants"."reviewer_clerk_id" IS NOT NULL AND "access_grants"."revoked_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "review_terminal_decision_uq" ON "review_decisions" USING btree ("content_version_id","reviewer_clerk_id") WHERE "review_decisions"."review_grant_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "access_grants" ADD CONSTRAINT "review_recipient_scope" CHECK ("access_grants"."reviewer_clerk_id" IS NULL OR "access_grants"."scope" = 'review');
--> statement-breakpoint
CREATE FUNCTION protect_review_comment() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Review comments are immutable; append a new comment to retain history.';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER review_comments_immutable BEFORE UPDATE OR DELETE ON review_comments
FOR EACH ROW EXECUTE FUNCTION protect_review_comment();
