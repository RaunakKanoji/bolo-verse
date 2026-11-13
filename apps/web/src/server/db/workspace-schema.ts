import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { assets, projects, workspaces } from "./schema";
const createdAt = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();
export const workspaceClients = pgTable(
  "workspace_clients",
  {
    id: uuid("id").primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    organization: text("organization").notNull().default(""),
    email: text("email").notNull().default(""),
    phone: text("phone").notNull().default(""),
    notes: text("notes").notNull().default(""),
    createdByClerkId: text("created_by_clerk_id").notNull(),
    creationFingerprint: text("creation_fingerprint").notNull(),
    revision: integer("revision").notNull().default(1),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("workspace_clients_workspace_idx").on(t.workspaceId),
    check("workspace_client_revision_positive", sql`${t.revision}>0`),
  ],
);
export const projectTasks = pgTable(
  "project_tasks",
  {
    id: uuid("id").primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    status: text("status", { enum: ["todo", "in_progress", "done"] })
      .default("todo")
      .notNull(),
    priority: text("priority", { enum: ["low", "normal", "high"] })
      .default("normal")
      .notNull(),
    dueDate: date("due_date"),
    ownerLabel: text("owner_label").default("").notNull(),
    createdByClerkId: text("created_by_clerk_id").notNull(),
    creationFingerprint: text("creation_fingerprint").notNull(),
    revision: integer("revision").default(1).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("project_tasks_project_idx").on(t.projectId),
    check("project_task_revision_positive", sql`${t.revision}>0`),
    check("project_task_status_valid", sql`${t.status} IN ('todo','in_progress','done')`),
    check("project_task_priority_valid", sql`${t.priority} IN ('low','normal','high')`),
  ],
);
// Organization is separate from immutable verified asset bytes and provenance.
export const assetLibraryMetadata = pgTable(
  "asset_library_metadata",
  {
    assetId: uuid("asset_id").primaryKey(),
    projectId: uuid("project_id").notNull(),
    collection: text("collection").default("").notNull(),
    archived: boolean("archived").default(false).notNull(),
    revision: integer("revision").default(1).notNull(),
    updatedAt: updatedAt(),
  },
  (t) => [
    foreignKey({
      columns: [t.assetId, t.projectId],
      foreignColumns: [assets.id, assets.projectId],
    }),
    index("asset_library_project_idx").on(t.projectId),
    check("asset_library_revision_positive", sql`${t.revision}>0`),
  ],
);
