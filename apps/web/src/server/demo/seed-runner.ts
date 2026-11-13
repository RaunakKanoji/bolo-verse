import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { Database } from "@/server/db/client";
import * as s from "@/server/db/schema";
import * as b from "@/server/db/brainstorm-schema";
import * as w from "@/server/db/workspace-schema";
import { validateDemoDataset } from "@/lib/demo/validate";
import { buildDemoRows } from "./seed-rows";
import type { DemoConfig } from "./config";

export async function seedDemo(database: Database, config: DemoConfig) {
  const r = buildDemoRows(config);
  const report = validateDemoDataset(r.dataset);
  if (report.errors.length) throw new Error(`Invalid demo dataset: ${report.errors.join("; ")}`);
  const inserted = await database.transaction(async (tx) => {
    await tx
      .insert(s.workspaces)
      .values({
        id: r.workspaceId,
        name: `Demo · ${config.slug}`,
        personalOwnerClerkId: config.owner,
        createdAt: r.created,
      })
      .onConflictDoNothing();
    const [workspace] = await tx
      .select()
      .from(s.workspaces)
      .where(eq(s.workspaces.id, r.workspaceId))
      .for("update");
    if (
      workspace?.personalOwnerClerkId !== config.owner ||
      workspace.name !== `Demo · ${config.slug}`
    )
      throw new Error("Demo workspace collision; no records changed.");
    const existing = await tx
      .select()
      .from(s.projects)
      .where(
        inArray(
          s.projects.id,
          r.projects.map((p) => p.id!),
        ),
      );
    if (existing.length) {
      if (
        existing.length !== r.projects.length ||
        existing.some(
          (p) =>
            p.workspaceId !== r.workspaceId ||
            p.createdByClerkId !== config.owner ||
            p.studioMetadata.creationFingerprint !== config.marker ||
            !p.sample,
        )
      )
        throw new Error("Demo project collision; no records changed.");
      return false;
    }
    await tx.insert(s.workspaceMembers).values({
      workspaceId: r.workspaceId,
      clerkUserId: config.owner,
      role: "owner",
      createdAt: r.created,
    });
    await tx.insert(w.workspaceClients).values(r.clients);
    await tx.insert(s.projects).values(r.projects);
    await tx.insert(s.projectMembers).values(
      r.projects.map((p) => ({
        projectId: p.id!,
        clerkUserId: config.owner,
        role: "creator" as const,
        createdAt: p.createdAt,
      })),
    );
    await tx.insert(s.briefVersions).values(r.briefs);
    await tx.insert(s.artifactVersions).values(r.directions);
    await tx.insert(s.artifactVersions).values(r.scripts);
    await tx.insert(s.assets).values(r.assets);
    await tx.insert(s.artifactVersions).values(r.storyboards);
    await tx.insert(s.artifactVersions).values(r.notes);
    await tx.insert(s.studioSessions).values(r.sessions);
    await tx.insert(s.contentVersions).values(r.content);
    await tx.insert(s.reviewComments).values(r.comments);
    await tx.insert(s.reviewDecisions).values(r.decisions);
    await tx.insert(b.brainstormSessions).values(r.conversations);
    await tx.insert(b.brainstormMessages).values(r.messages);
    await tx.insert(b.brainstormIdeas).values(r.ideas);
    await tx.insert(s.commandLogs).values(r.voice);
    await tx.insert(w.projectTasks).values(r.tasks);
    await tx.insert(w.assetLibraryMetadata).values(r.library);
    await tx.insert(s.xrWorkspaces).values(r.layouts);
    return true;
  });
  return { inserted, dataset: r.dataset };
}

export { validateSeededDemo } from "./validate-seed";

/** Logical reset preserves immutable published feedback and all authored payloads. */
export async function resetDemo(db: Database, config: DemoConfig, confirmation?: string) {
  if (confirmation !== config.slug)
    throw new Error(
      `Demo reset refused: pass --confirm=${config.slug}. Reset archives only; immutable history is retained.`,
    );
  const r = buildDemoRows(config);
  return db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(s.projects)
      .where(
        inArray(
          s.projects.id,
          r.projects.map((p) => p.id!),
        ),
      )
      .for("update");
    if (
      rows.some(
        (p) =>
          p.workspaceId !== r.workspaceId ||
          p.createdByClerkId !== config.owner ||
          p.studioMetadata.creationFingerprint !== config.marker ||
          !p.sample,
      )
    )
      throw new Error("Demo reset refused: ownership mismatch.");
    let changed = 0;
    for (const row of rows)
      if (row.studioMetadata.status !== "archived") {
        await tx
          .update(s.projects)
          .set({
            studioMetadata: { ...row.studioMetadata, status: "archived" },
            revision: sql`${s.projects.revision}+1`,
          })
          .where(and(eq(s.projects.id, row.id), eq(s.projects.revision, row.revision)));
        changed++;
      }
    return changed;
  });
}
