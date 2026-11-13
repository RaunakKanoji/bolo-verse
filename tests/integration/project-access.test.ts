import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const boundary = vi.hoisted(() => ({ subject: null as string | null, configured: true }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: boundary.subject }) }));
vi.mock("@/server/config/env", () => ({
  getServerEnv: () => boundary.configured
    ? { CLERK_SECRET_KEY: "sk_test_configured", NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_configured", DATABASE_URL: "postgres://test", ALLOWED_ORIGINS: ["http://localhost:3000"] }
    : {},
}));
vi.mock("@/server/db/client", () => ({
  withDatabase: <T>(operation: (db: typeof database) => Promise<T>) => operation(database),
}));

import * as schema from "@/server/db/schema";
import { bootstrapPersonalWorkspace, listAuthorizedProjects } from "@/server/db/projects";
import { seedSampleProject } from "@/server/db/seed";
import { GET as listProjects, POST as createProject } from "@/app/api/projects/route";
import { GET as readProject, PATCH as updateProject } from "@/app/api/projects/[id]/route";
import { ProjectSummarySchema } from "@/lib/contracts/shape";

const postgres = new PGlite();
const database = drizzle(postgres, { schema });
const owner = "user_test_owner";
const outsider = "user_test_outsider";
const client = "user_test_client";
const projectId = "a0000000-0000-4000-8000-000000000001";
const otherProjectId = "a0000000-0000-4000-8000-000000000002";
const request = new Request("http://localhost:3000/api/projects");

beforeAll(async () => {
  const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8")) as { entries: { tag: string }[] };
  for (const { tag } of journal.entries) {
    await postgres.exec(await readFile(`drizzle/${tag}.sql`, "utf8"));
  }
  const workspace = await bootstrapPersonalWorkspace(database, owner);
  const secondWorkspace = await bootstrapPersonalWorkspace(database, outsider);
  await database.insert(schema.projects).values([
    { id: projectId, workspaceId: workspace.id, name: "Owner sample", objective: "Fictional campaign", createdByClerkId: owner },
    { id: otherProjectId, workspaceId: secondWorkspace.id, name: "Private unrelated project", objective: "Private", createdByClerkId: outsider },
  ]);
  await database.insert(schema.projectMembers).values({ projectId, clerkUserId: client, role: "client" });
}, 30_000);

beforeEach(() => { boundary.subject = owner; boundary.configured = true; });
afterAll(async () => { await postgres.close(); });

const publicProjectFields = ["createdAt", "id", "name", "objective", "sample"];
function mutation(body: unknown, method = "POST", origin: string | null = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/projects", { method,
    headers: { "Content-Type": "application/json", ...(origin ? { Origin: origin } : {}) }, body: JSON.stringify(body) });
}

describe("server project boundary with PostgreSQL repositories", () => {
  it("offers only editable projects for the brainstorming chooser", async () => {
    expect((await listAuthorizedProjects(owner, { editableOnly: true })).map((project) => project.id)).toContain(projectId);
    expect(await listAuthorizedProjects(client, { editableOnly: true })).toEqual([]);
    expect((await listAuthorizedProjects(outsider, { editableOnly: true })).map((project) => project.id)).toEqual([otherProjectId]);
  });
  it("fails closed with 503 when credentials are absent", async () => {
    boundary.configured = false;
    const response = await listProjects();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: "PROVIDER_UNCONFIGURED" } });
  });

  it("returns 401 when Clerk has no validated session", async () => {
    boundary.subject = null;
    const response = await listProjects();
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: "UNAUTHORIZED" } });
  });

  it("lists only projects authorized by workspace ownership or explicit assignment", async () => {
    const response = await listProjects();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ ok: true, data: { projects: [{ id: projectId, name: "Owner sample" }] } });
    boundary.subject = client;
    const clientResponse = await listProjects();
    const body = await clientResponse.json();
    expect(body.data.projects).toHaveLength(1);
    expect(body.data.projects[0].id).toBe(projectId);
  });

  it("denies another project's UUID with 403 instead of leaking metadata", async () => {
    const response = await readProject(request, { params: Promise.resolve({ id: otherProjectId }) });
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect(JSON.stringify(body)).not.toContain("Private unrelated project");
  });

  it("allows an explicitly assigned client to read its project", async () => {
    boundary.subject = client;
    const response = await readProject(request, { params: Promise.resolve({ id: projectId }) });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, data: { project: { id: projectId } } });
  });

  it("returns only compatible public project fields from legacy list and detail reads", async () => {
    const listed = await (await listProjects()).json();
    for (const project of listed.data.projects) {
      expect(Object.keys(project).sort()).toEqual(publicProjectFields);
      expect(ProjectSummarySchema.parse(project)).toEqual(project);
    }
    boundary.subject = client;
    const detail = await (await readProject(request, { params: Promise.resolve({ id: projectId }) })).json();
    expect(Object.keys(detail.data.project).sort()).toEqual(publicProjectFields);
    expect(ProjectSummarySchema.parse(detail.data.project)).toEqual(detail.data.project);
  });

  it("creates, updates and reopens a legacy project with only public response fields", async () => {
    const response = await createProject(mutation({ name: "Baseline project", objective: "Verify persisted reopen" }));
    expect(response.status).toBe(201);
    const created = (await response.json()).data.project;
    expect(Object.keys(created).sort()).toEqual(publicProjectFields);
    const context = { params: Promise.resolve({ id: created.id }) };
    const updatedResponse = await updateProject(mutation({ objective: "Updated persisted objective" }, "PATCH"), context);
    expect(updatedResponse.status).toBe(200);
    const updated = (await updatedResponse.json()).data.project;
    expect(Object.keys(updated).sort()).toEqual(publicProjectFields);
    expect(ProjectSummarySchema.parse(updated)).toMatchObject({ id: created.id, name: "Baseline project", objective: "Updated persisted objective" });
    expect((await (await readProject(request, context)).json()).data.project).toEqual(updated);
    boundary.subject = outsider;
    expect((await readProject(request, context)).status).toBe(403);
  });

  it("retains identity, Origin, strict input, body bounds and project authorization on legacy writes", async () => {
    const context = { params: Promise.resolve({ id: projectId }) };
    const before = await database.select().from(schema.projects);
    for (const origin of [null, "https://attacker.invalid"]) {
      expect((await createProject(mutation({ name: "Denied", objective: "Denied" }, "POST", origin))).status).toBe(403);
    }
    expect((await createProject(mutation({ name: "Denied", objective: "Denied", workspaceId: otherProjectId }))).status).toBe(400);
    expect((await createProject(mutation({ name: "Denied", objective: "x".repeat(17_000) }))).status).toBe(413);
    boundary.subject = client;
    expect((await updateProject(mutation({ name: "Denied" }, "PATCH"), context)).status).toBe(403);
    boundary.subject = outsider;
    expect((await updateProject(mutation({ name: "Denied" }, "PATCH"), context)).status).toBe(403);
    boundary.subject = null;
    expect((await createProject(mutation({ name: "Denied", objective: "Denied" }))).status).toBe(401);
    expect(await database.select().from(schema.projects)).toEqual(before);
  });

  it("rejects a malformed ID before a database lookup", async () => {
    const response = await readProject(request, { params: Promise.resolve({ id: "not-a-uuid" }) });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
  });

  it("atomically bootstraps one workspace and owner membership for repeated visits", async () => {
    const visits = await Promise.all(Array.from({ length: 4 }, () => bootstrapPersonalWorkspace(database, "user_new_creator")));
    expect(new Set(visits.map((workspace) => workspace.id)).size).toBe(1);
    const owned = await postgres.query<{ count: number }>("SELECT count(*)::int AS count FROM workspaces WHERE personal_owner_clerk_id = 'user_new_creator'");
    const members = await postgres.query<{ role: string }>("SELECT role FROM workspace_members WHERE clerk_user_id = 'user_new_creator'");
    expect(owned.rows).toEqual([{ count: 1 }]);
    expect(members.rows).toEqual([{ role: "owner" }]);
  });

  it("does not grant project access to a workspace member without project assignment", async () => {
    const workspace = await bootstrapPersonalWorkspace(database, owner);
    await database.insert(schema.workspaceMembers).values({ workspaceId: workspace.id, clerkUserId: "user_unassigned_editor", role: "member" });
    boundary.subject = "user_unassigned_editor";
    const response = await readProject(request, { params: Promise.resolve({ id: projectId }) });
    expect(response.status).toBe(403);
  });

  it("prevents cross-project resource references at the database boundary", async () => {
    const assetId = "b0000000-0000-4000-8000-000000000001";
    await database.insert(schema.assets).values({ id: assetId, projectId: otherProjectId, ownerClerkId: outsider, objectKey: "private/test.png", mimeType: "image/png", byteSize: 123, status: "ready" });
    await expect(database.insert(schema.products).values({ projectId, name: "Invalid cross-project product", sourceImageAssetId: assetId })).rejects.toThrow();
  });

  it("prevents replacing the bytes identifier of a finalized asset", async () => {
    const assetId = "b0000000-0000-4000-8000-000000000002";
    await database.insert(schema.assets).values({ id: assetId, projectId, ownerClerkId: owner, objectKey: "private/finalized.png", mimeType: "image/png", byteSize: 456, status: "ready" });
    await expect(postgres.query("UPDATE assets SET object_key = 'private/replaced.png' WHERE id = $1", [assetId])).rejects.toThrow(/immutable/);
    await expect(postgres.query("UPDATE assets SET status = 'staging' WHERE id = $1", [assetId])).rejects.toThrow(/immutable/);
    const result = await postgres.query<{ object_key: string }>("SELECT object_key FROM assets WHERE id = $1", [assetId]);
    expect(result.rows).toEqual([{ object_key: "private/finalized.png" }]);
  });

  it("keeps a frozen output source and ready version immutable", async () => {
    const assetId = "b0000000-0000-4000-8000-000000000003";
    const outputId = "c0000000-0000-4000-8000-000000000001";
    await database.insert(schema.assets).values({ id: assetId, projectId, ownerClerkId: owner, objectKey: "private/output.webm", mimeType: "video/webm", byteSize: 1024, status: "ready" });
    // The mutation boundary's future JSON validation is separate from these DB invariants.
    await postgres.query("INSERT INTO content_versions (id, project_id, version, source_snapshot, author_clerk_id) VALUES ($1, $2, 1, $3, $4)", [outputId, projectId, { schemaVersion: 1, sceneRevision: 3 }, owner]);
    await expect(postgres.query("UPDATE content_versions SET source_snapshot = $1 WHERE id = $2", [{ schemaVersion: 1, sceneRevision: 4 }, outputId])).rejects.toThrow(/immutable/);
    await postgres.query("UPDATE content_versions SET status = 'ready', asset_id = $1, media_metadata = $2 WHERE id = $3", [assetId, { mimeType: "video/webm", width: 720, height: 1280, durationSeconds: 15 }, outputId]);
    await expect(postgres.query("UPDATE content_versions SET status = 'saving' WHERE id = $1", [outputId])).rejects.toThrow(/immutable/);
    await expect(postgres.query("DELETE FROM content_versions WHERE id = $1", [outputId])).rejects.toThrow(/immutable/);
  });

  it("seeds the fictional campaign idempotently without inventing approvals", async () => {
    const seededId = await seedSampleProject(database, "user_seeded_creator");
    expect(await seedSampleProject(database, "user_seeded_creator")).toBe(seededId);
    const seededProjects = await postgres.query<{ name: string; sample: boolean }>("SELECT name, sample FROM projects WHERE created_by_clerk_id = 'user_seeded_creator'");
    expect(seededProjects.rows).toEqual([{ name: "Ilkal saree · fictional sample", sample: true }]);
    const briefs = await postgres.query<{ status: string; payload: { facts: { text: string }[]; prohibitedClaims: string[] } }>("SELECT status, payload FROM brief_versions WHERE project_id = $1", [seededId]);
    expect(briefs.rows).toHaveLength(1);
    expect(briefs.rows[0].status).toBe("proposed");
    expect(briefs.rows[0].payload.facts.map((fact) => fact.text)).toEqual(["Silk-cotton blend", "Handwoven in Ilkal"]);
    expect(briefs.rows[0].payload.prohibitedClaims).toEqual(["pure silk", "machine washable"]);
    const artifacts = await postgres.query<{ kind: string }>("SELECT kind FROM artifact_versions WHERE project_id = $1 ORDER BY kind", [seededId]);
    expect(artifacts.rows.map((row) => row.kind)).toEqual(["direction", "script", "storyboard"]);
    const decisions = await postgres.query<{ count: number }>("SELECT count(*)::int AS count FROM review_decisions WHERE project_id = $1", [seededId]);
    expect(decisions.rows).toEqual([{ count: 0 }]);
  });

  it("accepts bounded string operation IDs and rejects duplicate side-effect reservations", async () => {
    const sessionId = "d0000000-0000-4000-8000-000000000001";
    await database.insert(schema.studioSessions).values({ id: sessionId, projectId, creatorClerkId: owner });
    const command = { projectId, sessionId, requestId: "retry-stable-id", actorClerkId: owner, action: "scale", result: { status: "pending" as const } };
    await database.insert(schema.commandLogs).values(command);
    await expect(database.insert(schema.commandLogs).values(command)).rejects.toThrow();
    const job = { projectId, kind: "render" as const, idempotencyKey: "render-request-1" };
    await database.insert(schema.processingJobs).values(job);
    await expect(database.insert(schema.processingJobs).values(job)).rejects.toThrow();
    await expect(database.insert(schema.commandLogs).values({ ...command, requestId: "x".repeat(129) })).rejects.toThrow();
  });

  it("prevents attaching another project's upload grant to an asset", async () => {
    const sessionId = "d0000000-0000-4000-8000-000000000002";
    const grantId = "e0000000-0000-4000-8000-000000000001";
    await database.insert(schema.studioSessions).values({ id: sessionId, projectId, creatorClerkId: owner });
    await database.insert(schema.accessGrants).values({ id: grantId, projectId, scope: "upload", sessionId, secretHash: "a".repeat(64), issuerClerkId: owner, expiresAt: new Date("2099-01-01") });
    await database.insert(schema.assets).values({ projectId, uploadGrantId: grantId, objectKey: "staging/correct-project.png", mimeType: "image/png", byteSize: 123 });
    await expect(database.insert(schema.assets).values({ projectId: otherProjectId, uploadGrantId: grantId, objectKey: "staging/wrong-project.png", mimeType: "image/png", byteSize: 123 })).rejects.toThrow();
  });
});
