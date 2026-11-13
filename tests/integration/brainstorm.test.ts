import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const identity = vi.hoisted(() => ({ subject: "brainstorm_owner" as string | null }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: identity.subject }) }));
vi.mock("@/server/db/client", () => ({ withDatabase: <T>(operation: (db: typeof database) => Promise<T>) => operation(database) }));
import * as schema from "@/server/db/schema";
import { bootstrapPersonalWorkspace } from "@/server/db/projects";
import { POST } from "@/app/api/v1/projects/[projectId]/brainstorm/route";
import { consumeBrainstormBudget } from "@/server/brainstorm/service";
const postgres = new PGlite();
const database = drizzle(postgres, { schema });
const owner = "brainstorm_owner", editor = "brainstorm_editor", client = "brainstorm_client", outsider = "brainstorm_outsider";
const projectId = "b3000000-0000-4000-8000-000000000001", otherId = "b3000000-0000-4000-8000-000000000002";
const brief = { schemaVersion: 1 as const, objective: "Launch the handwoven silk collection", audience: "Design-conscious shoppers", product: "Silk", format: "poster" as const, aspectRatio: "1:1" as const, tone: "Warm", language: "en-IN" as const, facts: [], prohibitedClaims: ["Pure silk"], constraints: ["Approved logo only"], notes: "Private note should not be sent", references: ["https://storage.test/private?signature=secret"] };
const directions = ["Craft", "Everyday", "Gifting"].map((name) => ({ name, concept: "Show the craft", visualDirection: "Warm light", proposedDeliverable: "Poster", productionSuggestion: "Close-up weave" }));
const generated = () => Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify({ reply: "Ideas grounded in your silk brief", directions }) }] } }] });
const fetcher = vi.fn<typeof fetch>();
const context = (id = projectId) => ({ params: Promise.resolve({ projectId: id }) });
function request(body: unknown = { message: "Three campaign directions", briefVersion: 1 }, origin: string | null = "http://localhost:3000", raw?: string) {
  return new Request("http://localhost:3000/api/v1/projects/brainstorm", { method: "POST", headers: { "Content-Type": "application/json", ...(origin ? { Origin: origin } : {}) }, body: raw ?? JSON.stringify(body) });
}
const post = (body?: unknown, id = projectId) => POST(request(body), context(id));
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
beforeAll(async () => {
  const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8")) as { entries: { tag: string }[] };
  for (const { tag } of journal.entries) await postgres.exec(await readFile(`drizzle/${tag}.sql`, "utf8"));
}, 30000);
beforeEach(async () => {
  identity.subject = owner; fetcher.mockReset(); fetcher.mockImplementation(async () => generated()); vi.stubGlobal("fetch", fetcher);
  for (const [key, value] of Object.entries({ CLERK_SECRET_KEY: "sk_test_configured", NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_configured", DATABASE_URL: "postgres://test", NEXT_PUBLIC_APP_URL: "http://localhost:3000", ALLOWED_ORIGINS: "http://localhost:3000", GEMINI_API_KEY: "private-gemini-key", GEMINI_MODEL: "configured-model", APP_MODE: "live" })) vi.stubEnv(key, value);
  await postgres.exec("TRUNCATE workspaces,rate_limit_buckets CASCADE");
  const mine = await bootstrapPersonalWorkspace(database, owner), theirs = await bootstrapPersonalWorkspace(database, outsider);
  await database.insert(schema.projects).values([
    { id: projectId, workspaceId: mine.id, name: "Silk campaign", objective: "Project goal", createdByClerkId: owner },
    { id: otherId, workspaceId: theirs.id, name: "Private project", objective: "Foreign private secret", createdByClerkId: outsider },
  ]);
  await database.insert(schema.projectMembers).values([{ projectId, clerkUserId: editor, role: "editor" }, { projectId, clerkUserId: client, role: "client" }]);
  await database.insert(schema.briefVersions).values([
    { projectId, version: 1, payload: brief, authorClerkId: owner },
    { projectId: otherId, version: 1, payload: { ...brief, objective: "Foreign private secret" }, authorClerkId: outsider },
  ]);
});
afterAll(async () => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); await postgres.close(); });

describe("authorized saved-brief brainstorming", () => {
  it.each([owner, editor])("grounds %s's real server request in the saved brief with no foreign/context secrets", async (subject) => {
    identity.subject = subject;
    const response = await post(); expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ ok: true, data: { directions, sourceBriefVersion: 1, providerStatus: "live" } });
    const body = String(fetcher.mock.calls[0][1]?.body);
    expect(body).toContain("Launch the handwoven silk collection"); expect(body).toContain("Design-conscious shoppers"); expect(body).toContain("Approved logo only");
    for (const text of ["Foreign private secret", "Private note should not be sent", "signature=secret", "private-gemini-key", owner]) expect(body).not.toContain(text);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect((await postgres.query("SELECT id FROM artifact_versions")).rows).toEqual([]);
  });
  it("denies client, outsider and missing/foreign projects before any provider call", async () => {
    for (const subject of [client, outsider]) { identity.subject = subject; expect((await post()).status).toBe(403); }
    identity.subject = owner;
    for (const id of [otherId, "b3000000-0000-4000-8000-000000000099"]) expect((await post(undefined, id)).status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("requires identity and trusted browser Origin and rejects malformed bearer", async () => {
    for (const origin of [null, "https://evil.test"]) expect((await POST(request(undefined, origin), context())).status).toBe(403);
    const bearer = request(); bearer.headers.set("authorization", "Bearer invalid"); expect((await POST(bearer, context())).status).toBe(401);
    identity.subject = null; expect((await post()).status).toBe(401); expect(fetcher).not.toHaveBeenCalled();
  });
  it("requires a saved brief, refuses stale source versions and malformed inputs", async () => {
    expect((await post({ message: "Help", briefVersion: 2 })).status).toBe(409);
    for (const body of [{}, { message: " " }, { message: "x".repeat(2001) }, { message: "Help", brief: brief }, { message: "Help", history: [] }, { message: "Help", briefVersion: 0 }]) expect((await post(body)).status).toBe(400);
    expect((await POST(request({}, undefined, "{bad"), context())).status).toBe(400);
    expect((await POST(request({}, undefined, "x".repeat(16385)), context())).status).toBe(413);
    expect((await post(undefined, "bad")).status).toBe(400);
    await postgres.query("DELETE FROM brief_versions WHERE project_id=$1", [projectId]);
    expect((await post()).status).toBe(409); expect(fetcher).not.toHaveBeenCalled();
  });
  it("fails honestly with no key and does not consume quota or silently mock demo mode", async () => {
    vi.stubEnv("GEMINI_API_KEY", ""); vi.stubEnv("APP_MODE", "demo");
    const response = await post(); expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: "PROVIDER_UNCONFIGURED" } });
    expect(fetcher).not.toHaveBeenCalled(); expect((await postgres.query("SELECT key_hash FROM rate_limit_buckets")).rows).toEqual([]);
  });
  it("enforces atomic actor/project and global account budgets under concurrent attempts", async () => {
    const outcomes = await Promise.allSettled(Array.from({ length: 12 }, () => consumeBrainstormBudget(owner, projectId)));
    expect(outcomes.filter((item) => item.status === "fulfilled")).toHaveLength(10);
    expect((await post()).status).toBe(429); expect(fetcher).not.toHaveBeenCalled();
    const rows = await postgres.query<{ count: number }>("SELECT count FROM rate_limit_buckets WHERE key_hash=$1", [hash(`xr-assistant:${owner}`)]); expect(rows.rows[0].count).toBe(10);
    await postgres.exec("TRUNCATE rate_limit_buckets");
    await postgres.query("INSERT INTO rate_limit_buckets(key_hash,count,window_start,expires_at) VALUES ($1,20,now(),now()+interval '1 hour')", [hash(`xr-assistant:${owner}`)]);
    expect((await post()).status).toBe(429);
    expect((await postgres.query("SELECT key_hash FROM rate_limit_buckets WHERE key_hash=$1", [hash(`creative-brainstorm:${owner}:${projectId}`)])).rows).toEqual([]);
    await postgres.exec("UPDATE rate_limit_buckets SET expires_at=now()-interval '1 second'");
    expect((await post()).status).toBe(200);
  });
  it("reauthorizes after Gemini latency and never exposes replies after revocation", async () => {
    identity.subject = editor;
    fetcher.mockImplementation(async () => { await postgres.query("DELETE FROM project_members WHERE project_id=$1 AND clerk_user_id=$2", [projectId, editor]); return generated(); });
    const response = await post(); expect(response.status).toBe(403); expect(await response.text()).not.toContain("Ideas grounded");
  });
  it("discards results when a newer brief is saved while Gemini is answering", async () => {
    fetcher.mockImplementation(async () => { await database.insert(schema.briefVersions).values({ id: randomUUID(), projectId, version: 2, payload: brief, authorClerkId: owner }); return generated(); });
    expect((await post()).status).toBe(409);
  });
  it("does not expose provider credentials/errors or persist generated directions", async () => {
    fetcher.mockRejectedValue(new Error("private-gemini-key internal driver error"));
    const response = await post(); expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("private-gemini-key"); expect(fetcher).toHaveBeenCalledTimes(1);
    expect((await postgres.query("SELECT id FROM artifact_versions")).rows).toEqual([]);
  });
});

it("never silently drops constraints to fit the prompt and does not charge rejected context", async () => {
  await postgres.query("UPDATE brief_versions SET payload=$1::jsonb WHERE project_id=$2", [JSON.stringify({ ...brief, constraints: Array(20).fill('"'.repeat(300)), prohibitedClaims: Array(20).fill('"'.repeat(300)) }), projectId]);
  const response = await post(); expect(response.status).toBe(400);
  expect(await response.text()).toContain("too large");
  expect(fetcher).not.toHaveBeenCalled();
  expect((await postgres.query("SELECT key_hash FROM rate_limit_buckets")).rows).toEqual([]);
});
