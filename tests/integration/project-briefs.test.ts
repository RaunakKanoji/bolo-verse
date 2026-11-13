import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const boundary = vi.hoisted(() => ({ subject: "brief_owner" as string | null }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: boundary.subject }) }));
vi.mock("@/server/db/client", () => ({ withDatabase: <T>(operation: (db: typeof database) => Promise<T>) => operation(database) }));
import * as schema from "@/server/db/schema";
import { bootstrapPersonalWorkspace } from "@/server/db/projects";
import { GET, PUT } from "@/app/api/v1/projects/[projectId]/brief/route";
import { GET as PROJECT } from "@/app/api/v1/projects/[projectId]/route";

const postgres = new PGlite();
const database = drizzle(postgres, { schema });
const owner = "brief_owner", editor = "brief_editor", client = "brief_client", outsider = "brief_outsider";
const projectId = "b2000000-0000-4000-8000-000000000001";
const otherId = "b2000000-0000-4000-8000-000000000002";
const missingId = "b2000000-0000-4000-8000-000000000099";
const context = (id = projectId) => ({ params: Promise.resolve({ projectId: id }) });
const payload = (objective = "Launch the collection") => ({ schemaVersion: 1, title: "Spring brief", objective, audience: "Shoppers", product: "Silk", format: "poster", aspectRatio: "1:1", tone: "Warm", language: "en-IN", facts: [{ id: "b2000000-0000-4000-8000-000000000003", text: "Handwoven" }], prohibitedClaims: ["Pure silk"], constraints: ["Use approved logo"], brandRequirements: "Violet", notes: "Internal notes", deadline: "2026-12-01" });
const input = (expectedVersion = 0, brief = payload(), idempotencyKey = randomUUID()) => ({ expectedVersion, brief, idempotencyKey });
const request = (body: unknown, origin: string | null = "http://localhost:3000", raw?: string) => new Request("http://localhost:3000/api/v1/projects/brief", { method: "PUT", headers: { "Content-Type": "application/json", ...(origin ? { Origin: origin } : {}) }, body: raw ?? JSON.stringify(body) });
const get = (id = projectId) => GET(new Request("http://localhost:3000/api/v1/projects/brief"), context(id));
const put = (body = input(), id = projectId) => PUT(request(body), context(id));
const data = async (response: Response) => (await response.json()).data;

beforeAll(async () => {
  const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8")) as { entries: { tag: string }[] };
  for (const { tag } of journal.entries) await postgres.exec(await readFile(`drizzle/${tag}.sql`, "utf8"));
}, 30_000);
beforeEach(async () => {
  boundary.subject = owner;
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_configured");
  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_configured");
  vi.stubEnv("DATABASE_URL", "postgres://test");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
  vi.stubEnv("ALLOWED_ORIGINS", "http://localhost:3000");
  await postgres.exec("TRUNCATE workspaces, rate_limit_buckets CASCADE");
  const workspace = await bootstrapPersonalWorkspace(database, owner);
  const other = await bootstrapPersonalWorkspace(database, outsider);
  await database.insert(schema.projects).values([
    { id: projectId, workspaceId: workspace.id, name: "Campaign", objective: "Project objective", createdByClerkId: owner },
    { id: otherId, workspaceId: other.id, name: "Other", objective: "Private", createdByClerkId: outsider },
  ]);
  await database.insert(schema.projectMembers).values([{ projectId, clerkUserId: editor, role: "editor" }, { projectId, clerkUserId: client, role: "client" }]);
});
afterAll(async () => { vi.unstubAllEnvs(); await postgres.close(); });

describe("authorized versioned project briefs", () => {
  it("saves rich fields and returns identical data on a fresh read without private identity", async () => {
    expect(await data(await get())).toMatchObject({ brief: null, version: 0, canEdit: true, savedAt: null });
    const write = await put();
    expect(write.status).toBe(200);
    expect(write.headers.get("cache-control")).toBe("no-store");
    const saved = await data(write);
    expect(saved).toMatchObject({ brief: payload(), version: 1, canEdit: true, savedAt: expect.any(String) });
    expect(await data(await get())).toEqual(saved);
    expect(JSON.stringify(saved)).not.toContain(owner);
    const project = await (await PROJECT(new Request("http://localhost:3000/api/v1/projects"), context())).json();
    expect(JSON.stringify(project)).not.toContain("Internal notes");
  });
  it("allows an assigned editor and retains all old version rows", async () => {
    await put(); boundary.subject = editor;
    expect((await put(input(1, payload("Revised objective")))).status).toBe(200);
    const rows = await postgres.query<{version: number; payload: unknown}>("SELECT version,payload FROM brief_versions ORDER BY version");
    expect(rows.rows).toEqual([{ version: 1, payload: payload() }, { version: 2, payload: payload("Revised objective") }]);
  });
  it("returns exactly the original result on retries even after another version is saved", async () => {
    const original = input();
    const saved = await data(await put(original));
    expect(await data(await put(original))).toEqual(saved);
    await put(input(1, payload("Newer")));
    expect(await data(await put(original))).toEqual(saved);
    expect((await postgres.query("SELECT id FROM brief_versions")).rows).toHaveLength(2);
    expect((await put({ ...original, brief: payload("Different") })).status).toBe(409);
    expect((await put({ ...original, expectedVersion: 1 })).status).toBe(409);
    boundary.subject = editor;
    expect((await put(original)).status).toBe(409);
  });
  it("serializes competing expectedVersion writes and competing first writes", async () => {
    const first = await Promise.all([put(input()), put(input(0, payload("Competing")))]);
    expect(first.map((r) => r.status).sort()).toEqual([200, 409]);
    const next = await Promise.all([put(input(1, payload("Next A"))), put(input(1, payload("Next B")))]);
    expect(next.map((r) => r.status).sort()).toEqual([200, 409]);
    expect((await data(await get())).version).toBe(2);
    expect((await put(input(0))).status).toBe(409);
  });
  it("deduplicates simultaneous retries", async () => {
    const body = input();
    const responses = await Promise.all([put(body), put(body)]);
    expect(responses.map((r) => r.status)).toEqual([200, 200]);
    expect(await data(responses[0])).toEqual(await data(responses[1]));
    expect((await postgres.query("SELECT id FROM brief_versions")).rows).toHaveLength(1);
  });
  it("clients see only approved versions in assigned projects and cannot write", async () => {
    const approved = input();
    await put(approved);
    boundary.subject = client;
    expect(await data(await get())).toMatchObject({ brief: null, version: 0, canEdit: false });
    expect((await put()).status).toBe(403);
    await postgres.query("UPDATE brief_versions SET status='approved' WHERE id=$1", [approved.idempotencyKey]);
    boundary.subject = owner;
    await put(input(1, payload("Private proposed revision")));
    boundary.subject = client;
    expect(await data(await get())).toMatchObject({ brief: payload(), version: 1, canEdit: false });
    expect((await get(otherId)).status).toBe(403);
  });
  it("denies unrelated/missing projects equally and does not allow cross-project idempotency reuse", async () => {
    const body = input(); await put(body);
    for (const id of [otherId, missingId]) {
      expect((await get(id)).status).toBe(403);
      expect((await put(input(), id)).status).toBe(403);
    }
    boundary.subject = outsider;
    expect((await get()).status).toBe(403);
    expect((await put()).status).toBe(403);
    expect((await put(body, otherId)).status).toBe(409);
    expect((await postgres.query("SELECT id FROM brief_versions WHERE project_id=$1", [otherId])).rows).toEqual([]);
  });
  it("checks identity, Origin, invalid bearer and malformed resource IDs", async () => {
    expect((await PUT(request(input(), null), context())).status).toBe(403);
    expect((await PUT(request(input(), "https://evil.test"), context())).status).toBe(403);
    const bearer = request(input()); bearer.headers.set("authorization", "Bearer invalid");
    expect((await PUT(bearer, context())).status).toBe(401);
    expect((await get("not-an-id")).status).toBe(400);
    expect((await put(input(), "not-an-id")).status).toBe(400);
    boundary.subject = null;
    expect((await get()).status).toBe(401);
    expect((await put()).status).toBe(401);
  });
  it("rejects empty/oversized/extra/malformed input without storing anything", async () => {
    for (const body of [
      {}, { ...input(), expectedVersion: -1 }, { ...input(), idempotencyKey: "bad" },
      { ...input(), subject: outsider }, { ...input(), brief: { ...payload(), objective: " " } },
      { ...input(), brief: { ...payload(), notes: "x".repeat(5001) } },
      { ...input(), brief: { ...payload(), references: ["https://u:password@example.com"] } },
      { ...input(), brief: { ...payload(), projectId: otherId } },
    ]) expect((await PUT(request(body), context())).status).toBe(400);
    expect((await PUT(request({}, undefined, "{bad"), context())).status).toBe(400);
    expect((await PUT(request({}, undefined, "x".repeat(32769)), context())).status).toBe(413);
    const wrongType = request(input()); wrongType.headers.set("content-type", "text/plain");
    expect((await PUT(wrongType, context())).status).toBe(415);
    expect((await postgres.query("SELECT id FROM brief_versions")).rows).toEqual([]);
  });
  it("sanitizes database failures and leaves no partial version", async () => {
    await postgres.exec("CREATE FUNCTION reject_brief() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'private database detail'; END $$; CREATE TRIGGER reject_brief BEFORE INSERT ON brief_versions FOR EACH ROW EXECUTE FUNCTION reject_brief();");
    try {
      const result = await put(); expect(result.status).toBe(503);
      expect(await result.text()).not.toContain("private database detail");
      expect((await postgres.query("SELECT id FROM brief_versions")).rows).toEqual([]);
    } finally { await postgres.exec("DROP TRIGGER reject_brief ON brief_versions; DROP FUNCTION reject_brief()"); }
  });
});
