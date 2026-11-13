import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/server/db/client", () => ({
  withDatabase: <T>(fn: (database: typeof db) => Promise<T>) => fn(db),
}));
import { readAuthorizedPreview } from "@/server/providers/authorized-preview";
import { GET as readAsset } from "@/app/api/v1/assets/[assetId]/content/route";
import * as schema from "@/server/db/schema";
import { seedDemo, validateSeededDemo, resetDemo } from "@/server/demo/seed-runner";
import { parseDemoConfig } from "@/server/demo/config";
import { eq, sql } from "drizzle-orm";
const pg = new PGlite();
const db = drizzle(pg, { schema });
const config = parseDemoConfig({ DEMO_SEED_ENABLED: "true" });
beforeAll(async () => {
  const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8"));
  for (const entry of journal.entries)
    await pg.exec(await readFile(`drizzle/${entry.tag}.sql`, "utf8"));
}, 60000);
afterAll(async () => {
  await pg.close();
});

describe("transactional offline demo seeding", () => {
  it("seeds twice without duplicates and validates actual PostgreSQL rows", async () => {
    const first = await seedDemo(db, config);
    const second = await seedDemo(db, config);
    expect(first.inserted).toBe(true);
    expect(second.inserted).toBe(false);
    expect(await validateSeededDemo(db, config)).toMatchObject({
      errors: [],
      counts: { projects: 12, clients: 5, content: 40, comments: 24, scripts: 15, storyboards: 10 },
    });
  });
  it("serves bundled bytes through existing authorization and denies foreign access", async () => {
    const { dataset } = await seedDemo(db, config);
    const assetId = dataset.content[0].assetId!;
    const context = { params: Promise.resolve({ assetId }) };
    const req = new Request(`http://localhost/api/v1/assets/${assetId}/content`);
    const response = await readAuthorizedPreview(config.owner, req, context);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(1000);
    await expect(readAuthorizedPreview("unrelated-actor", req, context)).rejects.toMatchObject({
      status: 403,
    });
    const forged = await readAsset(
      new Request(req.url, { headers: { Authorization: "Bearer synthetic" } }),
      context,
    );
    expect(forged.status).toBe(401);
  });
  it("rejects persisted relationship and ownership drift before snapshot export", async () => {
    const { dataset } = await seedDemo(db, config);
    const p = dataset.projects[0];
    const corruptions = [
      [
        "UPDATE projects SET studio_metadata=jsonb_set(studio_metadata,'{clientId}','\"foreign-client\"') WHERE id=$1",
        [p.id],
      ],
      ["UPDATE project_members SET role='client' WHERE project_id=$1", [p.id]],
      [
        "UPDATE brainstorm_messages SET message='Corrupted synthetic history' WHERE id=$1",
        [dataset.conversations[0].messages[0].id],
      ],
      ["UPDATE content_versions SET status='failed' WHERE id=$1", [dataset.content[38].id]],
      [
        "UPDATE xr_workspaces SET layout=jsonb_set(layout,'{objects,0,transform,position}','[20,20,20]') WHERE id=$1",
        [dataset.layouts[0].id],
      ],
    ] as const;
    for (const [query, params] of corruptions) {
      try {
        await db.transaction(async (tx) => {
          const [before, after] = query.split("$1");
          await tx.execute(sql`${sql.raw(before)}${params[0]}${sql.raw(after ?? "")}`);
          expect((await validateSeededDemo(tx, config)).errors.length).toBeGreaterThan(0);
          throw new Error("rollback corruption fixture");
        });
      } catch (error) {
        if (!(error instanceof Error) || error.message !== "rollback corruption fixture")
          throw error;
      }
    }
    expect((await validateSeededDemo(db, config)).errors).toEqual([]);
  });
  it("preserves edits on rerun and refuses unowned ID collisions atomically", async () => {
    const { dataset } = await seedDemo(db, config);
    const id = dataset.projects[0].id;
    await db
      .update(schema.projects)
      .set({ name: "Presenter's rehearsal edit" })
      .where(eq(schema.projects.id, id));
    await seedDemo(db, config);
    expect(
      (await db.select().from(schema.projects).where(eq(schema.projects.id, id)))[0].name,
    ).toBe("Presenter's rehearsal edit");
    await db
      .update(schema.projects)
      .set({ name: dataset.projects[0].title })
      .where(eq(schema.projects.id, id));
    const other = parseDemoConfig({
      DEMO_SEED_ENABLED: "true",
      DEMO_WORKSPACE_SLUG: "collision-demo",
    });
    const { buildDemoDataset } = await import("@/lib/demo/dataset");
    const collision = buildDemoDataset(other).projects[2];
    await db.insert(schema.projects).values({
      id: collision.id,
      workspaceId: (await db.select().from(schema.workspaces))[0].id,
      name: "Unrelated",
      objective: "Keep me",
      createdByClerkId: "unrelated",
    });
    await expect(seedDemo(db, other)).rejects.toThrow();
    expect((await db.select().from(schema.projects)).length).toBe(13);
    expect((await db.select().from(schema.workspaces)).length).toBe(1);
  });
  it("requires reset confirmation, archives only seed projects and preserves immutable reviews", async () => {
    await expect(resetDemo(db, config, "wrong")).rejects.toThrow();
    expect(await resetDemo(db, config, config.slug)).toBe(12);
    expect(await resetDemo(db, config, config.slug)).toBe(0);
    expect(await validateSeededDemo(db, config)).toMatchObject({ errors: [], archived: true });
    const rows = await db.select().from(schema.projects);
    expect(rows.filter((p) => p.studioMetadata.status === "archived")).toHaveLength(12);
    expect(rows.find((p) => p.createdByClerkId === "unrelated")?.name).toBe("Unrelated");
    expect(await db.select().from(schema.reviewComments)).toHaveLength(24);
    expect(await db.select().from(schema.reviewDecisions)).toHaveLength(6);
    const comment = (await db.select().from(schema.reviewComments))[0];
    await expect(
      db.delete(schema.reviewComments).where(eq(schema.reviewComments.id, comment.id)),
    ).rejects.toThrow();
    await seedDemo(db, config);
    expect(
      (await db.select().from(schema.projects)).filter(
        (p) => p.studioMetadata.status === "archived",
      ),
    ).toHaveLength(12);
  });
});
