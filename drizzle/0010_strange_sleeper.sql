CREATE TABLE "asset_library_metadata" (
	"asset_id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"collection" text DEFAULT '' NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "asset_library_revision_positive" CHECK ("asset_library_metadata"."revision">0)
);
--> statement-breakpoint
CREATE TABLE "project_tasks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'todo' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"due_date" date,
	"owner_label" text DEFAULT '' NOT NULL,
	"created_by_clerk_id" text NOT NULL,
	"creation_fingerprint" text NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_task_revision_positive" CHECK ("project_tasks"."revision">0),
	CONSTRAINT "project_task_status_valid" CHECK ("project_tasks"."status" IN ('todo','in_progress','done')),
	CONSTRAINT "project_task_priority_valid" CHECK ("project_tasks"."priority" IN ('low','normal','high'))
);
--> statement-breakpoint
CREATE TABLE "workspace_clients" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"organization" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_by_clerk_id" text NOT NULL,
	"creation_fingerprint" text NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_client_revision_positive" CHECK ("workspace_clients"."revision">0)
);
--> statement-breakpoint
CREATE TABLE "brainstorm_ideas" (
	"id" uuid PRIMARY KEY NOT NULL,
	"session_id" uuid NOT NULL,
	"request_hash" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"tags" jsonb NOT NULL,
	"category" text NOT NULL,
	"source_message_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brainstorm_idea_title" CHECK (char_length("brainstorm_ideas"."title") BETWEEN 1 AND 120),
	CONSTRAINT "brainstorm_idea_description" CHECK (char_length("brainstorm_ideas"."description") BETWEEN 1 AND 4000),
	CONSTRAINT "brainstorm_idea_category" CHECK ("brainstorm_ideas"."category" IN ('idea','concept','direction','outline','action'))
);
--> statement-breakpoint
CREATE TABLE "brainstorm_messages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"session_id" uuid NOT NULL,
	"request_hash" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"content" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brainstorm_message_session_id_uq" UNIQUE("id","session_id"),
	CONSTRAINT "brainstorm_message_text" CHECK (char_length("brainstorm_messages"."message") BETWEEN 1 AND 2000),
	CONSTRAINT "brainstorm_message_status" CHECK ("brainstorm_messages"."status" IN ('pending','completed','uncertain')),
	CONSTRAINT "brainstorm_message_content_status" CHECK (("brainstorm_messages"."status" = 'completed') = ("brainstorm_messages"."content" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "brainstorm_mutations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"session_id" uuid NOT NULL,
	"request_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brainstorm_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"owner_clerk_id" text NOT NULL,
	"project_id" uuid,
	"title" text NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"create_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brainstorm_session_revision" CHECK ("brainstorm_sessions"."revision" >= 0),
	CONSTRAINT "brainstorm_session_title" CHECK (char_length("brainstorm_sessions"."title") BETWEEN 1 AND 120)
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "studio_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "revision" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
-- Existing rows have no prior edit timestamp; preserve their actual creation time.
UPDATE "projects" SET "updated_at" = "created_at";--> statement-breakpoint
ALTER TABLE "asset_library_metadata" ADD CONSTRAINT "asset_library_metadata_asset_id_project_id_assets_id_project_id_fk" FOREIGN KEY ("asset_id","project_id") REFERENCES "public"."assets"("id","project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_clients" ADD CONSTRAINT "workspace_clients_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brainstorm_ideas" ADD CONSTRAINT "brainstorm_ideas_session_id_brainstorm_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."brainstorm_sessions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brainstorm_ideas" ADD CONSTRAINT "brainstorm_ideas_source_message_id_session_id_brainstorm_messages_id_session_id_fk" FOREIGN KEY ("source_message_id","session_id") REFERENCES "public"."brainstorm_messages"("id","session_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brainstorm_messages" ADD CONSTRAINT "brainstorm_messages_session_id_brainstorm_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."brainstorm_sessions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brainstorm_mutations" ADD CONSTRAINT "brainstorm_mutations_session_id_brainstorm_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."brainstorm_sessions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brainstorm_sessions" ADD CONSTRAINT "brainstorm_sessions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brainstorm_sessions" ADD CONSTRAINT "brainstorm_sessions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "asset_library_project_idx" ON "asset_library_metadata" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_tasks_project_idx" ON "project_tasks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "workspace_clients_workspace_idx" ON "workspace_clients" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "brainstorm_ideas_session_idx" ON "brainstorm_ideas" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "brainstorm_messages_session_idx" ON "brainstorm_messages" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "brainstorm_mutations_session_idx" ON "brainstorm_mutations" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "brainstorm_sessions_owner_updated_idx" ON "brainstorm_sessions" USING btree ("owner_clerk_id","updated_at");