import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const boundary = vi.hoisted(() => ({ subject: "user_project_owner" as string | null }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: boundary.subject }) }));
vi.mock("@/server/db/client", () => ({
  withDatabase: <T>(operation: (db: typeof database) => Promise<T>) => operation(database),
}));

import * as schema from "@/server/db/schema";
import { bootstrapPersonalWorkspace, readProjectAccess } from "@/server/db/projects";
import * as collection from "@/app/api/projects/route";
import { PATCH as updateProject } from "@/app/api/projects/[id]/route";

const postgres = new PGlite();
const database = drizzle(postgres, { schema });
const owner = "user_project_owner";
const outsider = "user_project_outsider";
const creator = "user_project_creator";
const editor = "user_project_editor";
const client = "user_project_client";
const workspaceMember = "user_workspace_member";
const projectId = "a0000000-0000-4000-8000-000000000001";
const otherProjectId = "a0000000-0000-4000-8000-000000000002";
const valid = { name: "Saree campaign", objective: "Introduce the collection." };

function mutation(body: unknown = valid, options: { origin?: string | null; method?: string; raw?: string; headers?: Record<string, string> } = {}) {
  const headers = new Headers({ "Content-Type": "application/json", ...options.headers });
  if (options.origin !== null) headers.set("Origin", options.origin ?? "http://localhost:3000");
  return new Request("http://localhost:3000/api/projects", {
    method: options.method ?? "POST", headers, body: options.raw ?? JSON.stringify(body),
  });
}

function patch(body: unknown, id = projectId, origin: string | null = "http://localhost:3000") {
  return updateProject(mutation(body, { method: "PATCH", origin }), { params: Promise.resolve({ id }) });
}

beforeAll(async () => {
  const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8")) as { entries: { tag: string }[] };
  for (const { tag } of journal.entries) {
    await postgres.exec(await readFile(`drizzle/${tag}.sql`, "utf8"));
  }
}, 30_000);

beforeEach(async () => {
  boundary.subject = owner;
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_configured");
  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_configured");
  vi.stubEnv("DATABASE_URL", "postgres://test");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
  vi.stubEnv("ALLOWED_ORIGINS", "http://localhost:3000,https://preview.boloverse.test");
  vi.stubEnv("APP_MODE", "live");
  await postgres.exec("TRUNCATE workspaces, rate_limit_buckets CASCADE");
  const workspace = await bootstrapPersonalWorkspace(database, owner);
  const otherWorkspace = await bootstrapPersonalWorkspace(database, outsider);
  await database.insert(schema.projects).values([
    { id: projectId, workspaceId: workspace.id, name: "Existing project", objective: "Original objective", createdByClerkId: owner },
    { id: otherProjectId, workspaceId: otherWorkspace.id, name: "Private project", objective: "Private objective", createdByClerkId: outsider },
  ]);
  await database.insert(schema.projectMembers).values([
    { projectId, clerkUserId: creator, role: "creator" },
    { projectId, clerkUserId: editor, role: "editor" },
    { projectId, clerkUserId: client, role: "client" },
  ]);
  await database.insert(schema.workspaceMembers).values({ workspaceId: workspace.id, clerkUserId: workspaceMember, role: "member" });
});
afterAll(async () => { vi.unstubAllEnvs(); await postgres.close(); });

describe("project mutations through the real PostgreSQL repositories", () => {
  it("creates a project and explicit creator membership in the authenticated user's personal workspace", async () => {
    const response = await collection.POST(mutation({ name: "  Saree campaign  ", objective: "  Introduce the collection.  " }));
    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(body).toMatchObject({ ok: true, data: { project: {
      name: "Saree campaign", objective: "Introduce the collection.", sample: false,
    } }, requestId: expect.any(String) });
    expect(Object.keys(body.data.project).sort()).toEqual(["createdAt", "id", "name", "objective", "sample"]);
    const persisted = await postgres.query("SELECT p.name, p.created_by_clerk_id, w.personal_owner_clerk_id, m.role FROM projects p JOIN workspaces w ON w.id = p.workspace_id JOIN project_members m ON m.project_id = p.id WHERE p.id = $1 AND m.clerk_user_id = $2", [body.data.project.id, "user_project_owner"]);
    expect(persisted.rows).toEqual([{ name: "Saree campaign", created_by_clerk_id: owner, personal_owner_clerk_id: "user_project_owner", role: "creator" }]);
    const listed = await (await collection.GET()).json();
    expect(listed.data.projects.map((project: { id: string }) => project.id)).toContain(body.data.project.id);
    expect(await readProjectAccess(owner, body.data.project.id)).toMatchObject({ project: { id: body.data.project.id }, canEdit: true });
  });

  it("bootstraps a first-time creator and never places their project in another assigned workspace", async () => {
    boundary.subject = editor;
    const response = await collection.POST(mutation());
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data.project).not.toHaveProperty("workspaceId");
    const result = await postgres.query("SELECT w.personal_owner_clerk_id, m.role FROM projects p JOIN workspaces w ON w.id = p.workspace_id JOIN workspace_members m ON m.workspace_id = w.id WHERE p.id = $1", [body.data.project.id]);
    expect(result.rows).toEqual([{ personal_owner_clerk_id: editor, role: "owner" }]);
  });

  it("rolls back project, bootstrap, and creation budget if creator membership cannot be stored", async () => {
    boundary.subject = "user_failed_creator";
    await postgres.exec(`CREATE FUNCTION reject_test_membership() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'private database detail'; END $$;
      CREATE TRIGGER reject_test_membership BEFORE INSERT ON project_members FOR EACH ROW EXECUTE FUNCTION reject_test_membership();`);
    try {
      const response = await collection.POST(mutation());
      expect(response.status).toBe(503);
      const body = await response.json();
      expect(body).toMatchObject({ ok: false, error: { code: "SERVICE_UNAVAILABLE", retryable: true } });
      expect(JSON.stringify(body)).not.toContain("private database detail");
      const projects = await postgres.query("SELECT id FROM projects WHERE created_by_clerk_id = 'user_failed_creator'");
      const workspaces = await postgres.query("SELECT id FROM workspaces WHERE personal_owner_clerk_id = 'user_failed_creator'");
      const buckets = await postgres.query("SELECT key_hash FROM rate_limit_buckets");
      expect(projects.rows).toEqual([]);
      expect(workspaces.rows).toEqual([]);
      expect(buckets.rows).toEqual([]);
    } finally {
      await postgres.exec("DROP TRIGGER reject_test_membership ON project_members; DROP FUNCTION reject_test_membership()");
    }
  });

  it.each([owner, creator, editor])("allows %s to update permitted metadata without losing other fields", async (subject) => {
    boundary.subject = subject;
    expect(await readProjectAccess(subject, projectId)).toMatchObject({ canEdit: true });
    const response = await patch({ name: "  Renamed project  " });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ ok: true, data: { project: {
      id: projectId, name: "Renamed project", objective: "Original objective",
    } } });
    const persisted = await postgres.query("SELECT name, objective, created_by_clerk_id FROM projects WHERE id = $1", [projectId]);
    expect(persisted.rows).toEqual([{ name: "Renamed project", objective: "Original objective", created_by_clerk_id: owner }]);
  });

  it.each([client, outsider, workspaceMember])("denies metadata mutation by %s", async (subject) => {
    boundary.subject = subject;
    const response = await patch({ objective: "Unauthorized change" });
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    const persisted = await postgres.query("SELECT objective FROM projects WHERE id = $1", [projectId]);
    expect(persisted.rows).toEqual([{ objective: "Original objective" }]);
  });

  it("gives assigned clients read access without edit permission and denies outsiders", async () => {
    expect(await readProjectAccess(client, projectId)).toMatchObject({ project: { id: projectId }, canEdit: false });
    await expect(readProjectAccess(outsider, projectId)).rejects.toMatchObject({ status: 403, code: "FORBIDDEN" });
  });

  it("does not let ownership of one workspace authorize an edit in another", async () => {
    const forbidden = await patch({ name: "Unauthorized change" }, otherProjectId);
    const missing = await patch({ name: "Unauthorized change" }, "a0000000-0000-4000-8000-000000000099");
    expect(forbidden.status).toBe(403);
    expect(missing.status).toBe(403);
    const forbiddenBody = await forbidden.json();
    const missingBody = await missing.json();
    expect(forbiddenBody.error).toEqual(missingBody.error);
    expect(JSON.stringify(forbiddenBody)).not.toContain("Private project");
  });

  it("requires a validated Clerk session for both mutations", async () => {
    boundary.subject = null;
    for (const response of [await collection.POST(mutation()), await patch({ name: "Updated" })]) {
      expect(response.status).toBe(401);
      expect(await response.json()).toMatchObject({ ok: false, error: { code: "UNAUTHORIZED" } });
    }
  });

  it("fails closed when required provider configuration is missing", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const response = await collection.POST(mutation());
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: "PROVIDER_UNCONFIGURED" } });
  });

  it.each([null, "null", "https://evil.test", "http://localhost:3000.evil.test", "http://localhost:3000/", "http://localhost:3000/path"])("rejects an untrusted or missing origin %s on both writes", async (origin) => {
    for (const response of [await collection.POST(mutation(valid, { origin })), await patch({ name: "Changed" }, projectId, origin)]) {
      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    }
    const buckets = await postgres.query("SELECT key_hash FROM rate_limit_buckets");
    expect(buckets.rows).toEqual([]);
  });

  it("accepts another exact configured preview origin", async () => {
    expect((await collection.POST(mutation(valid, { origin: "https://preview.boloverse.test" }))).status).toBe(201);
  });

  it.each([
    null, [], "project", 42, {},
    { name: " ", objective: "Valid" }, { name: "Valid", objective: " " },
    { name: "x".repeat(121), objective: "Valid" }, { name: "Valid", objective: "x".repeat(2001) },
    { ...valid, workspaceId: otherProjectId }, { ...valid, createdByClerkId: outsider },
    { ...valid, role: "owner" }, { ...valid, sample: true },
  ])("rejects invalid or identity-bearing creation payload %#", async (body) => {
    const response = await collection.POST(mutation(body));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    const stored = await postgres.query("SELECT id FROM projects WHERE name = 'Saree campaign'");
    expect(stored.rows).toEqual([]);
  });

  it.each([{}, null, { name: "" }, { objective: " " }, { name: 42 }, { name: "x".repeat(121) }, { objective: "x".repeat(2001) }, { ...valid, workspaceId: otherProjectId }, { ...valid, createdByClerkId: outsider }])("rejects invalid or privileged metadata patches %#", async (body) => {
    expect((await patch(body)).status).toBe(400);
    const persisted = await postgres.query("SELECT name, objective FROM projects WHERE id = $1", [projectId]);
    expect(persisted.rows).toEqual([{ name: "Existing project", objective: "Original objective" }]);
  });

  it("rejects malformed project IDs before an update", async () => {
    expect((await patch({ name: "Changed" }, "not-a-uuid")).status).toBe(400);
  });

  it.each<{ raw: string; headers: Record<string, string>; status: number }>([
    { raw: "{", headers: {}, status: 400 },
    { raw: "", headers: {}, status: 400 },
    { raw: JSON.stringify(valid), headers: { "Content-Type": "text/plain" }, status: 415 },
    { raw: JSON.stringify(valid), headers: { "Content-Length": "invalid" }, status: 400 },
    { raw: JSON.stringify(valid), headers: { "Content-Length": "16385" }, status: 413 },
    { raw: " ".repeat(16_385), headers: {}, status: 413 },
    { raw: " ".repeat(16_385), headers: { "Content-Length": "1" }, status: 413 },
    { raw: JSON.stringify({ name: "Valid", objective: "🙂".repeat(4100) }), headers: {}, status: 413 },
  ])("bounds JSON parsing and reports malformed payload %#", async ({ raw, headers, status }) => {
    const response = await collection.POST(mutation(valid, { raw, headers }));
    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
  });

  it("cancels unread bytes after malformed UTF-8 instead of retaining a live request stream", async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new Uint8Array([0xff])); },
      cancel() { cancelled = true; },
    });
    const options: RequestInit & { duplex: "half" } = {
      method: "POST", duplex: "half", body,
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
    };
    const response = await collection.POST(new Request("http://localhost:3000/api/projects", options));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    expect(cancelled).toBe(true);
  });

  it("enforces a durable atomic creation budget under concurrent requests and resets an expired bucket", async () => {
    const responses = await Promise.all(Array.from({ length: 12 }, () => collection.POST(mutation())));
    expect(responses.filter((response) => response.status === 201)).toHaveLength(10);
    expect(responses.filter((response) => response.status === 429)).toHaveLength(2);
    expect(await responses.find((response) => response.status === 429)!.json()).toMatchObject({
      ok: false, error: { code: "RATE_LIMITED", retryable: true },
    });
    const persisted = await postgres.query("SELECT count(*)::int AS count FROM projects WHERE name = 'Saree campaign'");
    expect(persisted.rows).toEqual([{ count: 10 }]);
    const buckets = await postgres.query<{ key_hash: string; count: number }>("SELECT key_hash, count FROM rate_limit_buckets");
    expect(buckets.rows).toHaveLength(1);
    expect(buckets.rows[0]).toEqual({ key_hash: expect.stringMatching(/^[a-f0-9]{64}$/), count: 10 });
    await postgres.exec("UPDATE rate_limit_buckets SET expires_at = now() - interval '1 second'");
    expect((await collection.POST(mutation())).status).toBe(201);
    const reset = await postgres.query("SELECT count FROM rate_limit_buckets");
    expect(reset.rows).toEqual([{ count: 1 }]);
  });
});
