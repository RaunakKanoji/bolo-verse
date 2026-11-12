CREATE TABLE "xr_workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"layout" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "xr_workspaces_project_id_unique" UNIQUE("project_id"),
	CONSTRAINT "xr_workspace_version_positive" CHECK ("xr_workspaces"."version" > 0),
	CONSTRAINT "xr_workspace_layout_version" CHECK (COALESCE("xr_workspaces"."layout"->>'schemaVersion' = '1', false))
);
--> statement-breakpoint
ALTER TABLE "xr_workspaces" ADD CONSTRAINT "xr_workspaces_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;