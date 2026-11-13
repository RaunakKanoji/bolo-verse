import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const auth = vi.hoisted(() => ({ subject: "owner" as string | null }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: auth.subject }) }));
vi.mock("@/server/db/client", () => ({
  withDatabase: <T>(fn: (database: typeof db) => Promise<T>) => fn(db),
}));
import * as schema from "@/server/db/schema";
import { brainstormIdeas, brainstormSessions } from "@/server/db/brainstorm-schema";
import { bootstrapPersonalWorkspace } from "@/server/db/projects";
import { GET, POST } from "@/app/api/projects/[id]/artifacts/route";
const pg = new PGlite();
const db = drizzle(pg, { schema });
const project = "a7000000-0000-4000-8000-000000000001",
  other = "a7000000-0000-4000-8000-000000000002";
const briefId = "a7000000-0000-4000-8000-000000000003",
  otherBrief = "a7000000-0000-4000-8000-000000000004";
const brief = {
  schemaVersion: 1,
  objective: "Launch coffee",
  audience: "Commuters",
  product: "Coffee",
  format: "reel",
  aspectRatio: "9:16",
  tone: "Warm",
  language: "en-IN",
  facts: [],
  constraints: [],
  prohibitedClaims: [],
} as const;
const direction = {
  kind: "direction",
  schemaVersion: 1,
  briefVersionId: briefId,
  title: "Morning",
  hook: "Wake up",
  concept: "A morning ritual",
  visualTreatment: "Warm sunlight",
  rationale: "Grounded in the brief",
  constraints: [],
} as const;
const context = (id = project) => ({ params: Promise.resolve({ id }) });
const input = (
  artifact: unknown = direction,
  expectedVersion = 0,
  idempotencyKey = randomUUID(),
) => ({ artifact, expectedVersion, idempotencyKey });
const req = (body: unknown, origin: string | null = "http://localhost:3000") =>
  new Request("http://localhost:3000/api/projects/artifacts", {
    method: "POST",
    headers: { "content-type": "application/json", ...(origin ? { origin } : {}) },
    body: JSON.stringify(body),
  });
const save = (body: unknown = input(), id = project) => POST(req(body), context(id));
const list = (id = project) =>
  GET(new Request("http://localhost:3000/api/projects/artifacts"), context(id));
const data = async (res: Response) => (await res.json()).data;
beforeAll(async () => {
  const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8")) as {
    entries: { tag: string }[];
  };
  for (const { tag } of journal.entries)
    await pg.exec(await readFile(`drizzle/${tag}.sql`, "utf8"));
}, 30000);
beforeEach(async () => {
  auth.subject = "owner";
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_configured");
  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_configured");
  vi.stubEnv("DATABASE_URL", "postgres://test");
  vi.stubEnv("ALLOWED_ORIGINS", "http://localhost:3000");
  await pg.exec("TRUNCATE workspaces, rate_limit_buckets CASCADE");
  const workspace = await bootstrapPersonalWorkspace(db, "owner");
  await db.insert(schema.projects).values([
    {
      id: project,
      workspaceId: workspace.id,
      name: "Campaign",
      objective: "Coffee",
      createdByClerkId: "owner",
    },
    {
      id: other,
      workspaceId: workspace.id,
      name: "Other",
      objective: "Other",
      createdByClerkId: "owner",
    },
  ]);
  await db.insert(schema.projectMembers).values([
    { projectId: project, clerkUserId: "editor", role: "editor" },
    { projectId: project, clerkUserId: "client", role: "client" },
  ]);
  await db.insert(schema.briefVersions).values([
    {
      id: briefId,
      projectId: project,
      version: 1,
      payload: { ...brief, facts: [], constraints: [], prohibitedClaims: [] },
      authorClerkId: "owner",
    },
    {
      id: otherBrief,
      projectId: other,
      version: 1,
      payload: { ...brief, facts: [], constraints: [], prohibitedClaims: [] },
      authorClerkId: "owner",
    },
  ]);
});
afterAll(async () => {
  vi.unstubAllEnvs();
  await pg.close();
});
describe("private immutable production artifacts", () => {
  it("persists direction, script, storyboard and notes with history after a fresh read", async () => {
    const d = await data(await save());
    const s = await data(
      await save(
        input({
          kind: "script",
          schemaVersion: 1,
          briefVersionId: briefId,
          directionVersionId: d.id,
          sections: [
            {
              id: randomUUID(),
              spokenText: "Morning starts here",
              onScreenText: "Coffee",
              durationSeconds: 5,
            },
          ],
          callToAction: "Try it",
        }),
      ),
    );
    const shot = {
      id: randomUUID(),
      durationSeconds: 5,
      framing: "Close up",
      cameraMovement: "Static",
      description: "Pour coffee",
      narration: "Morning starts here",
      textOverlay: "Coffee",
      assetIds: [],
      lighting: "Warm sunlight",
      shootingNotes: "Use practical steam",
    };
    const board = { kind: "storyboard", schemaVersion: 1, scriptVersionId: s.id, shots: [shot] };
    await save(input(board));
    await save(input({ ...board, shots: [{ ...shot, description: "Pour cold brew" }] }, 1));
    await save(
      input({ kind: "note", schemaVersion: 1, text: "Check steam", linkedArtifactVersionId: s.id }),
    );
    const result = await data(await list());
    expect(result.versions).toHaveLength(5);
    expect(
      result.versions
        .filter((v: { kind: string }) => v.kind === "storyboard")
        .map((v: { version: number }) => v.version),
    ).toEqual([2, 1]);
    expect(result.briefs[0]).toMatchObject({ id: briefId, version: 1 });
    expect(JSON.stringify(result)).not.toContain("authorClerkId");
    expect(JSON.stringify(result)).not.toContain("owner");
    expect((await list()).headers.get("cache-control")).toBe("no-store");
  });
  it("serializes per-kind CAS, preserves old versions and safely retries the original UUID", async () => {
    const body = input();
    const first = await data(await save(body));
    expect(
      (
        await Promise.all([
          save(input({ ...direction, title: "A" }, 1)),
          save(input({ ...direction, title: "B" }, 1)),
        ])
      )
        .map((r) => r.status)
        .sort(),
    ).toEqual([200, 409]);
    expect(await data(await save(body))).toEqual(first);
    expect((await save({ ...body, artifact: { ...direction, title: "Changed" } })).status).toBe(
      409,
    );
    auth.subject = "editor";
    expect((await save(body)).status).toBe(409);
    expect((await save(input({ ...direction, title: "Editor" }, 2))).status).toBe(200);
    expect((await pg.query("SELECT id FROM artifact_versions")).rows).toHaveLength(3);
  });
  it("deduplicates simultaneous UUID retries and denies cross-project UUID reuse", async () => {
    const body = input();
    const responses = await Promise.all([save(body), save(body)]);
    expect(responses.map((r) => r.status)).toEqual([200, 200]);
    expect(await data(responses[0])).toEqual(await data(responses[1]));
    expect(
      (await save({ ...body, artifact: { ...direction, briefVersionId: otherBrief } }, other))
        .status,
    ).toBe(409);
  });
  it("rejects cross-project and wrong-kind source references", async () => {
    expect((await save(input({ ...direction, briefVersionId: otherBrief }))).status).toBe(400);
    const d = await data(await save());
    expect(
      (
        await save(
          input({
            kind: "storyboard",
            schemaVersion: 1,
            scriptVersionId: d.id,
            shots: [
              {
                id: randomUUID(),
                durationSeconds: 5,
                framing: "Wide",
                cameraMovement: "Static",
                description: "Coffee",
                narration: "",
                textOverlay: "",
                assetIds: [],
                lighting: "Day",
                shootingNotes: "",
              },
            ],
          }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await save(
          input(
            { kind: "note", schemaVersion: 1, text: "Private", linkedArtifactVersionId: d.id },
            0,
          ),
          other,
        )
      ).status,
    ).toBe(400);
  });
  it("denies clients, outsiders and revoked editors from reading internal production", async () => {
    await save();
    for (const subject of ["client", "outsider"]) {
      auth.subject = subject;
      expect((await list()).status).toBe(403);
      expect((await save()).status).toBe(403);
    }
    auth.subject = "editor";
    expect((await list()).status).toBe(200);
    await pg.query("DELETE FROM project_members WHERE clerk_user_id='editor'");
    expect((await list()).status).toBe(403);
  });
  it("includes only the current actor's saved ideas linked to this project", async () => {
    const [workspace] = await db.select().from(schema.workspaces);
    const mine = randomUUID(),
      theirs = randomUUID(),
      elsewhere = randomUUID();
    await db.insert(brainstormSessions).values([
      {
        id: mine,
        workspaceId: workspace.id,
        projectId: project,
        ownerClerkId: "owner",
        title: "Mine",
        createHash: "x",
      },
      {
        id: theirs,
        workspaceId: workspace.id,
        projectId: project,
        ownerClerkId: "editor",
        title: "Theirs",
        createHash: "x",
      },
      {
        id: elsewhere,
        workspaceId: workspace.id,
        projectId: other,
        ownerClerkId: "owner",
        title: "Elsewhere",
        createHash: "x",
      },
    ]);
    await db.insert(brainstormIdeas).values([
      {
        id: randomUUID(),
        sessionId: mine,
        requestHash: "x",
        title: "My concept",
        description: "Useful saved context",
        tags: [],
        category: "idea",
      },
      {
        id: randomUUID(),
        sessionId: theirs,
        requestHash: "x",
        title: "Editor secret",
        description: "Other actor",
        tags: [],
        category: "idea",
      },
      {
        id: randomUUID(),
        sessionId: elsewhere,
        requestHash: "x",
        title: "Other project",
        description: "Other project",
        tags: [],
        category: "idea",
      },
    ]);
    const result = await data(await list());
    expect(result.ideas).toEqual([
      { id: expect.any(String), title: "My concept", description: "Useful saved context" },
    ]);
    auth.subject = "editor";
    expect((await data(await list())).ideas).toEqual([
      { id: expect.any(String), title: "Editor secret", description: "Other actor" },
    ]);
  });
  it("requires real identity, trusted origin, valid IDs and bounded strict JSON", async () => {
    expect((await POST(req(input(), null), context())).status).toBe(403);
    expect((await POST(req(input(), "https://evil.test"), context())).status).toBe(403);
    expect((await save(input(), "invalid")).status).toBe(400);
    expect((await save({ ...input(), role: "creator" })).status).toBe(400);
    expect(
      (await save(input({ kind: "note", schemaVersion: 1, text: "x".repeat(5001) }))).status,
    ).toBe(400);
    expect(
      (await save(input({ kind: "note", schemaVersion: 1, text: "x".repeat(32769) }))).status,
    ).toBe(413);
    auth.subject = null;
    expect((await list()).status).toBe(401);
    expect((await save()).status).toBe(401);
  });
});
