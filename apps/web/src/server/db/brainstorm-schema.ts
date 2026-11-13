import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import type { BrainstormStudioContent } from "@/lib/contracts/brainstorm-studio";
import { projects, workspaces } from "./schema";
const time = (name: string) => timestamp(name, { withTimezone: true });
export const brainstormSessions = pgTable(
  "brainstorm_sessions",
  {
    id: uuid("id").primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "restrict" }),
    ownerClerkId: text("owner_clerk_id").notNull(),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    pinned: boolean("pinned").notNull().default(false),
    revision: integer("revision").notNull().default(0),
    createHash: text("create_hash").notNull(),
    createdAt: time("created_at").notNull().defaultNow(),
    updatedAt: time("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("brainstorm_sessions_owner_updated_idx").on(t.ownerClerkId, t.updatedAt),
    check("brainstorm_session_revision", sql`${t.revision} >= 0`),
    check("brainstorm_session_title", sql`char_length(${t.title}) BETWEEN 1 AND 120`),
  ],
);
export const brainstormMessages = pgTable(
  "brainstorm_messages",
  {
    id: uuid("id").primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => brainstormSessions.id, { onDelete: "restrict" }),
    requestHash: text("request_hash").notNull(),
    message: text("message").notNull(),
    status: text("status", { enum: ["pending", "completed", "uncertain"] })
      .notNull()
      .default("pending"),
    content: jsonb("content").$type<BrainstormStudioContent>(),
    createdAt: time("created_at").notNull().defaultNow(),
  },
  (t) => [
    unique("brainstorm_message_session_id_uq").on(t.id, t.sessionId),
    index("brainstorm_messages_session_idx").on(t.sessionId, t.createdAt),
    check("brainstorm_message_text", sql`char_length(${t.message}) BETWEEN 1 AND 2000`),
    check("brainstorm_message_status", sql`${t.status} IN ('pending','completed','uncertain')`),
    check(
      "brainstorm_message_content_status",
      sql`(${t.status} = 'completed') = (${t.content} IS NOT NULL)`,
    ),
  ],
);
export const brainstormIdeas = pgTable(
  "brainstorm_ideas",
  {
    id: uuid("id").primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => brainstormSessions.id, { onDelete: "restrict" }),
    requestHash: text("request_hash").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    tags: jsonb("tags").$type<string[]>().notNull(),
    category: text("category", {
      enum: ["idea", "concept", "direction", "outline", "action"],
    }).notNull(),
    sourceMessageId: uuid("source_message_id"),
    createdAt: time("created_at").notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.sourceMessageId, t.sessionId],
      foreignColumns: [brainstormMessages.id, brainstormMessages.sessionId],
    }),
    index("brainstorm_ideas_session_idx").on(t.sessionId),
    check("brainstorm_idea_title", sql`char_length(${t.title}) BETWEEN 1 AND 120`),
    check("brainstorm_idea_description", sql`char_length(${t.description}) BETWEEN 1 AND 4000`),
    check(
      "brainstorm_idea_category",
      sql`${t.category} IN ('idea','concept','direction','outline','action')`,
    ),
  ],
);
export const brainstormMutations = pgTable(
  "brainstorm_mutations",
  {
    id: uuid("id").primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => brainstormSessions.id, { onDelete: "restrict" }),
    requestHash: text("request_hash").notNull(),
    createdAt: time("created_at").notNull().defaultNow(),
  },
  (t) => [index("brainstorm_mutations_session_idx").on(t.sessionId)],
);
