CREATE TABLE "creative_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"owner_clerk_id" text NOT NULL,
	"revision" integer NOT NULL,
	"document" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "creative_drafts_project_owner_uq" UNIQUE("project_id","owner_clerk_id"),
	CONSTRAINT "creative_draft_revision_positive" CHECK ("creative_drafts"."revision" > 0),
	CONSTRAINT "creative_draft_document_version" CHECK (COALESCE("creative_drafts"."document"->>'schemaVersion' = '1', false))
);
--> statement-breakpoint
ALTER TABLE "creative_drafts" ADD CONSTRAINT "creative_drafts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE FUNCTION protect_review_decision() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Review decisions are immutable; append a new decision to retain history.';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER review_decisions_immutable
  BEFORE UPDATE OR DELETE ON review_decisions
  FOR EACH ROW EXECUTE FUNCTION protect_review_decision();
