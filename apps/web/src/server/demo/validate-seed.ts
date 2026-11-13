import "server-only";
import { eq, inArray } from "drizzle-orm";
import type { Database } from "@/server/db/client";
import * as s from "@/server/db/schema";
import * as b from "@/server/db/brainstorm-schema";
import * as w from "@/server/db/workspace-schema";
import { validateDemoDataset } from "@/lib/demo/validate";
import { buildDemoRows } from "./seed-rows";
import type { DemoConfig } from "./config";

const stable = (value: unknown): string =>
  JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  );

/** Validate the persisted manifest, not just row counts, before exporting public fixtures. */
export async function validateSeededDemo(db: Database, config: DemoConfig) {
  const r = buildDemoRows(config),
    expected = validateDemoDataset(r.dataset),
    errors = [...expected.errors];
  const ids = r.projects.map((p) => p.id!),
    conversationIds = r.conversations.map((c) => c.id);
  const [
    workspace,
    members,
    projects,
    projectMembers,
    clients,
    briefs,
    artifacts,
    assets,
    content,
    sessions,
    conversations,
    messages,
    ideas,
    comments,
    decisions,
    voice,
    tasks,
    layouts,
    library,
  ] = await Promise.all([
    db.select().from(s.workspaces).where(eq(s.workspaces.id, r.workspaceId)),
    db.select().from(s.workspaceMembers).where(eq(s.workspaceMembers.workspaceId, r.workspaceId)),
    db.select().from(s.projects).where(inArray(s.projects.id, ids)),
    db.select().from(s.projectMembers).where(inArray(s.projectMembers.projectId, ids)),
    db.select().from(w.workspaceClients).where(eq(w.workspaceClients.workspaceId, r.workspaceId)),
    db.select().from(s.briefVersions).where(inArray(s.briefVersions.projectId, ids)),
    db.select().from(s.artifactVersions).where(inArray(s.artifactVersions.projectId, ids)),
    db.select().from(s.assets).where(inArray(s.assets.projectId, ids)),
    db.select().from(s.contentVersions).where(inArray(s.contentVersions.projectId, ids)),
    db.select().from(s.studioSessions).where(inArray(s.studioSessions.projectId, ids)),
    db
      .select()
      .from(b.brainstormSessions)
      .where(eq(b.brainstormSessions.workspaceId, r.workspaceId)),
    db
      .select()
      .from(b.brainstormMessages)
      .where(inArray(b.brainstormMessages.sessionId, conversationIds)),
    db
      .select()
      .from(b.brainstormIdeas)
      .where(inArray(b.brainstormIdeas.sessionId, conversationIds)),
    db.select().from(s.reviewComments).where(inArray(s.reviewComments.projectId, ids)),
    db.select().from(s.reviewDecisions).where(inArray(s.reviewDecisions.projectId, ids)),
    db.select().from(s.commandLogs).where(inArray(s.commandLogs.projectId, ids)),
    db.select().from(w.projectTasks).where(inArray(w.projectTasks.projectId, ids)),
    db.select().from(s.xrWorkspaces).where(inArray(s.xrWorkspaces.projectId, ids)),
    db.select().from(w.assetLibraryMetadata).where(inArray(w.assetLibraryMetadata.projectId, ids)),
  ]);
  const verify = (
    label: string,
    expected: readonly object[],
    actual: readonly object[],
    keys = ["id"],
  ) => {
    const key = (row: object) => keys.map((k) => (row as Record<string, unknown>)[k]).join(":");
    const rows = new Map(actual.map((row) => [key(row), row as Record<string, unknown>]));
    if (actual.length !== expected.length) errors.push(`Incorrect ${label} count.`);
    for (const want of expected) {
      const row = rows.get(key(want));
      if (
        !row ||
        Object.entries(want).some(
          ([field, value]) => value !== undefined && stable(row[field]) !== stable(value),
        )
      )
        errors.push(`Persisted ${label} differs from seed manifest.`);
    }
  };
  verify(
    "workspace",
    [
      {
        id: r.workspaceId,
        name: `Demo · ${config.slug}`,
        personalOwnerClerkId: config.owner,
        createdAt: r.created,
      },
    ],
    workspace,
  );
  verify(
    "workspace membership",
    [
      {
        workspaceId: r.workspaceId,
        clerkUserId: config.owner,
        role: "owner",
        createdAt: r.created,
      },
    ],
    members,
    ["workspaceId", "clerkUserId"],
  );
  verify(
    "project",
    r.projects.map((p) => ({
      ...p,
      revision:
        projects.find((row) => row.id === p.id)?.studioMetadata.status === "archived" ? 2 : 1,
      studioMetadata:
        projects.find((row) => row.id === p.id)?.studioMetadata.status === "archived"
          ? { ...p.studioMetadata, status: "archived" }
          : p.studioMetadata,
    })),
    projects,
  );
  verify(
    "project membership",
    r.projects.map((p) => ({
      projectId: p.id,
      clerkUserId: config.owner,
      role: "creator",
      createdAt: p.createdAt,
    })),
    projectMembers,
    ["projectId", "clerkUserId"],
  );
  verify("client", r.clients, clients);
  verify("brief", r.briefs, briefs);
  verify("artifact", [...r.directions, ...r.scripts, ...r.storyboards, ...r.notes], artifacts);
  verify("asset", r.assets, assets);
  verify("content", r.content, content);
  verify("studio session", r.sessions, sessions);
  verify("conversation", r.conversations, conversations);
  verify("message", r.messages, messages);
  verify("idea", r.ideas, ideas);
  verify("comment", r.comments, comments);
  verify("decision", r.decisions, decisions);
  verify("voice history", r.voice, voice);
  verify("task", r.tasks, tasks);
  verify("XR layout", r.layouts, layouts);
  verify("asset library", r.library, library, ["assetId"]);
  const counts = {
    profiles: r.dataset.profiles.length, // Descriptive metadata; no identity/profile table is fabricated.
    clients: clients.length,
    projects: projects.length,
    briefs: briefs.length,
    conversations: conversations.length,
    messages: messages.length,
    directions: artifacts.filter((a) => a.kind === "direction").length,
    scripts: artifacts.filter((a) => a.kind === "script").length,
    storyboards: artifacts.filter((a) => a.kind === "storyboard").length,
    content: content.length,
    voice: voice.length,
    comments: comments.length,
    decisions: decisions.length,
    layouts: layouts.length,
    tasks: tasks.length,
    assets: assets.length,
  };
  return { errors, counts, archived: projects.some((p) => p.studioMetadata.status === "archived") };
}
