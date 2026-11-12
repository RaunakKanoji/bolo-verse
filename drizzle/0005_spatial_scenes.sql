CREATE TABLE "spatial_scenes" (
	"project_id" uuid PRIMARY KEY NOT NULL,
	"scene_id" uuid NOT NULL,
	"revision" integer NOT NULL,
	"document" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "spatial_scenes_scene_id_unique" UNIQUE("scene_id"),
	CONSTRAINT "spatial_scene_revision_positive" CHECK ("spatial_scenes"."revision" > 0),
	CONSTRAINT "spatial_scene_stable_identity" CHECK ("spatial_scenes"."scene_id" = "spatial_scenes"."project_id" AND COALESCE("spatial_scenes"."document"->>'sceneId' = "spatial_scenes"."scene_id"::text, false)),
	CONSTRAINT "spatial_scene_document_version" CHECK (COALESCE("spatial_scenes"."document"->>'version' = '1', false))
);
--> statement-breakpoint
ALTER TABLE "spatial_scenes" ADD CONSTRAINT "spatial_scenes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;