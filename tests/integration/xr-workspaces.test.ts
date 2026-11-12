import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { beforeAll, beforeEach, afterAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const boundary = vi.hoisted(() => ({ subject: "user_xr_owner" as string | null }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: boundary.subject }) }));
vi.mock("@/server/db/client", () => ({ withDatabase: <T>(operation: (db: typeof database) => Promise<T>) => operation(database) }));

import * as schema from "@/server/db/schema";
import { bootstrapPersonalWorkspace } from "@/server/db/projects";
import { XRLayoutSchema, XRWorkspaceDataSchema } from "@/lib/contracts/xr-workspace";
import { GET, PUT } from "@/app/api/xr/workspaces/[projectId]/route";
import { POST as RESET } from "@/app/api/xr/workspaces/[projectId]/reset/route";

const postgres = new PGlite();
const database = drizzle(postgres, { schema });
const owner = "user_xr_owner";
const outsider = "user_xr_outsider";
const creator = "user_xr_creator";
const editor = "user_xr_editor";
const client = "user_xr_client";
const projectId = "b0000000-0000-4000-8000-000000000001";
const otherProjectId = "b0000000-0000-4000-8000-000000000002";
const assetId = "c0000000-0000-4000-8000-000000000001";
const otherAssetId = "c0000000-0000-4000-8000-000000000002";
const stagingAssetId = "c0000000-0000-4000-8000-000000000003";
const context = (id = projectId) => ({ params: Promise.resolve({ projectId: id }) });
const transform = { position: [1, 2, -3], rotation: [0, 15, 0], scale: [1, 1, 1] };
const layout = { schemaVersion: 1, environment: "creative-studio", objects: [{ id: "project-overview", type: "panel", transform }] };
function request(body: unknown, method = "PUT", origin = "http://localhost:3000") {
  return new Request(`http://localhost:3000/api/xr/workspaces/${projectId}`, { method, headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(body) });
}
async function get(id = projectId) { return GET(new Request(`http://localhost:3000/api/xr/workspaces/${id}`), context(id)); }
async function save(expectedVersion = 0, nextLayout: unknown = layout) { return PUT(request({ expectedVersion, layout: nextLayout }), context()); }

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
  await postgres.exec("TRUNCATE workspaces CASCADE");
  const workspace = await bootstrapPersonalWorkspace(database, owner);
  const other = await bootstrapPersonalWorkspace(database, outsider);
  await database.insert(schema.projects).values([
    { id: projectId, workspaceId: workspace.id, name: "Real campaign", objective: "Our objective", createdByClerkId: owner },
    { id: otherProjectId, workspaceId: other.id, name: "Secret campaign", objective: "Secret objective", createdByClerkId: outsider },
  ]);
  await database.insert(schema.projectMembers).values([
    { projectId, clerkUserId: creator, role: "creator" },
    { projectId, clerkUserId: editor, role: "editor" },
    { projectId, clerkUserId: client, role: "client" },
  ]);
  await database.insert(schema.assets).values([
    { id: assetId, projectId, ownerClerkId: owner, objectKey: "private/real.png", mimeType: "image/png", byteSize: 100, status: "ready" },
    { id: otherAssetId, projectId: otherProjectId, ownerClerkId: outsider, objectKey: "private/secret.png", mimeType: "image/png", byteSize: 100, status: "ready" },
    { id: stagingAssetId, projectId, ownerClerkId: owner, objectKey: "private/staging.png", mimeType: "image/png", byteSize: 100, status: "staging" },
  ]);
});
afterAll(async () => { vi.unstubAllEnvs(); await postgres.close(); });

describe("authorized XR workspace persistence", () => {
  it("returns a canonical unsaved layout and only authorized ready asset metadata", async () => {
    const response = await get();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const { data } = await response.json();
    expect(XRWorkspaceDataSchema.safeParse(data).success).toBe(true);
    expect(data).toMatchObject({ canEdit: true, project: { id: projectId, name: "Real campaign" }, workspace: { id: null, version: 0, updatedAt: null } });
    expect(data.content.assets.map((asset: { id: string }) => asset.id)).toEqual([assetId]);
    expect(JSON.stringify(data)).not.toMatch(/private\/|objectKey|Secret campaign|sample-/);
    expect(data.workspace.layout.objects.map((object: { id: string }) => object.id)).toEqual(["project-overview", `asset-${assetId}`]);
    expect((await postgres.query("SELECT * FROM xr_workspaces")).rows).toEqual([]);
  });
  it.each([owner, creator, editor])("persists and restores transforms for %s", async (subject) => {
    boundary.subject = subject;
    const response = await save();
    expect(response.status).toBe(200);
    const { data } = await response.json();
    expect(data.workspace).toMatchObject({ projectId, version: 1, layout });
    expect(data.workspace.id).toMatch(/^[a-f\d-]{36}$/);
    expect(data.workspace.updatedAt).toMatch(/^\d{4}-/);
    expect((await (await get()).json()).data.workspace).toEqual(data.workspace);
    const second = await save(1, { ...layout, objects: [{ ...layout.objects[0], transform: { ...transform, position: [3, 2, -5] } }] });
    expect((await second.json()).data.workspace.version).toBe(2);
  });
  it("allows assigned clients to read but denies save and reset", async () => {
    await save();
    boundary.subject = client;
    expect((await (await get()).json()).data.canEdit).toBe(false);
    expect((await save(1)).status).toBe(403);
    expect((await RESET(request({ expectedVersion: 1 }, "POST"), context())).status).toBe(403);
  });
  it("does not disclose whether inaccessible project IDs exist", async () => {
    boundary.subject = outsider;
    const denied = await get();
    const missing = await get("b0000000-0000-4000-8000-000000000099");
    expect(denied.status).toBe(403);
    expect(missing.status).toBe(403);
    expect((await denied.json()).error).toEqual((await missing.json()).error);
    expect((await save()).status).toBe(403);
  });
  it("rejects a revoked editor at the write boundary", async () => {
    boundary.subject = editor;
    expect((await get()).status).toBe(200);
    await postgres.query("DELETE FROM project_members WHERE project_id=$1 AND clerk_user_id=$2", [projectId, editor]);
    expect((await save()).status).toBe(403);
    expect((await postgres.query("SELECT * FROM xr_workspaces")).rows).toEqual([]);
  });
  it("first-save races and subsequent stale writes conflict without losing the winner", async () => {
    const responses = await Promise.all([save(), save()]);
    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    expect((await responses.find((response) => response.status === 409)!.json()).error.code).toBe("CONFLICT");
    const stale = await save(0);
    expect(stale.status).toBe(409);
    expect((await (await get()).json()).data.workspace.version).toBe(1);
    const updateRaces = await Promise.all([save(1), save(1)]);
    expect(updateRaces.map((response) => response.status).sort()).toEqual([200, 409]);
    expect((await (await get()).json()).data.workspace.version).toBe(2);
  });
  it("resets atomically to current authorized content and advances the existing version", async () => {
    const first = (await (await save()).json()).data.workspace;
    const response = await RESET(request({ expectedVersion: 1 }, "POST"), context());
    expect(response.status).toBe(200);
    const { data } = await response.json();
    expect(data.workspace.id).toBe(first.id);
    expect(data.workspace.version).toBe(2);
    expect(data.workspace.layout.objects).toHaveLength(2);
    expect((await RESET(request({ expectedVersion: 1 }, "POST"), context())).status).toBe(409);
  });
  it.each([otherAssetId, stagingAssetId, "c0000000-0000-4000-8000-000000000099"])("denies a forged or unavailable asset %s", async (id) => {
    const response = await save(0, { ...layout, objects: [{ id: `asset-${id}`, type: "asset", assetId: id, transform }] });
    expect(response.status).toBe(400);
    expect((await postgres.query("SELECT * FROM xr_workspaces")).rows).toEqual([]);
  });
  it("persists an authorized asset transform without persisting keys or signed URLs", async () => {
    const next = { ...layout, objects: [{ id: `asset-${assetId}`, type: "asset", assetId, transform }] };
    expect((await save(0, next)).status).toBe(200);
    expect((await (await get()).json()).data.workspace.layout).toEqual(next);
  });
  it.each([
    { ...layout, ownerId: owner },
    { ...layout, projectId: otherProjectId },
    { ...layout, objects: [layout.objects[0], layout.objects[0]] },
    { ...layout, objects: [{ ...layout.objects[0], id: "forged-brief" }] },
    { ...layout, objects: [{ ...layout.objects[0], transform: { ...transform, position: [31, 0, 0] } }] },
    { ...layout, objects: [{ ...layout.objects[0], transform: { ...transform, scale: [0, 1, 1] } }] },
    { ...layout, objects: [{ ...layout.objects[0], transform: { ...transform, rotation: [0, 361, 0] } }] },
    { ...layout, objects: [{ ...layout.objects[0], assetId }] },
    { ...layout, objects: [{ ...layout.objects[0], type: "asset" }] },
    { ...layout, objects: Array.from({ length: 51 }, (_, index) => ({ ...layout.objects[0], id: `panel-${index}` })) },
  ])("rejects malformed or noncanonical layout %#", async (next) => { expect((await save(0, next)).status).toBe(400); });
  it("rejects unknown ownership fields and invalid versions in the write envelope", async () => {
    for (const body of [{ expectedVersion: 0, layout, ownerId: owner }, { expectedVersion: -1, layout }, { expectedVersion: 0.5, layout }, { layout }]) {
      expect((await PUT(request(body), context())).status).toBe(400);
    }
  });
  it("requires identity and exact trusted origin for mutations", async () => {
    expect((await PUT(request({ expectedVersion: 0, layout }, "PUT", "https://evil.test"), context())).status).toBe(403);
    boundary.subject = null;
    expect((await get()).status).toBe(401);
    expect((await save()).status).toBe(401);
  });
  it("validates project IDs and bounded JSON before persistence", async () => {
    expect((await get("invalid")).status).toBe(400);
    const big = request({ expectedVersion: 0, layout, extra: "x".repeat(17000) });
    expect((await PUT(big, context())).status).toBe(413);
  });
  it("validates finite transforms independently of JSON transport", () => {
    expect(XRLayoutSchema.safeParse({ ...layout, objects: [{ ...layout.objects[0], transform: { ...transform, position: [NaN, 0, 0] } }] }).success).toBe(false);
  });
  it("projects actual latest brief/artifact content and review decisions without inventing approvals", async () => {
    const briefId = "d0000000-0000-4000-8000-000000000001";
    const oldBriefId = "d0000000-0000-4000-8000-000000000002";
    const artifactId = "d0000000-0000-4000-8000-000000000003";
    const oldArtifactId = "d0000000-0000-4000-8000-000000000004";
    const outputId = "d0000000-0000-4000-8000-000000000005";
    const brief = { schemaVersion: 1 as const, objective: "Current factual objective", audience: "Local clients", product: "Real item", format: "reel" as const, aspectRatio: "9:16" as const, tone: "Clear", language: "en-IN" as const, facts: [], prohibitedClaims: ["Unsupported result"], constraints: ["Use the actual product"] };
    await database.insert(schema.briefVersions).values([
      { id: oldBriefId, projectId, version: 1, payload: { ...brief, objective: "Outdated objective" }, authorClerkId: owner },
      { id: briefId, projectId, version: 2, payload: brief, authorClerkId: owner, status: "proposed" },
    ]);
    await database.insert(schema.artifactVersions).values([
      { id: oldArtifactId, projectId, kind: "note", version: 1, payload: { kind: "note", schemaVersion: 1, text: "Outdated note" }, authorClerkId: owner },
      { id: artifactId, projectId, kind: "note", version: 2, payload: { kind: "note", schemaVersion: 1, text: "Current supplied note" }, authorClerkId: owner },
    ]);
    // Only review joins require an output identity; no ready media or approval is fabricated.
    await postgres.query("INSERT INTO content_versions (id, project_id, version, source_snapshot, author_clerk_id) VALUES ($1,$2,1,'{}'::jsonb,$3)", [outputId, projectId, owner]);
    await database.insert(schema.reviewComments).values({ projectId, contentVersionId: outputId, reviewerClerkId: client, comment: "Please adjust the closing frame" });
    await database.insert(schema.reviewDecisions).values({ projectId, contentVersionId: outputId, reviewerClerkId: client, decision: "changes_requested", reason: "Needs updated details" });
    const { data } = await (await get()).json();
    expect(data.content.brief).toMatchObject({ id: briefId, status: "proposed", title: "Real item brief" });
    expect(data.content.brief.body).toContain("Current factual objective");
    expect(data.content.brief.body).toContain("Do not claim: Unsupported result");
    expect(data.content.artifacts).toEqual([{ id: artifactId, kind: "note", title: "Project note", body: "Current supplied note" }]);
    expect(data.content.reviews).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "comment", body: "Please adjust the closing frame", decision: null, contentVersionId: outputId }),
      expect.objectContaining({ kind: "decision", body: "Needs updated details", decision: "changes_requested", contentVersionId: outputId }),
    ]));
    const ids = data.workspace.layout.objects.map((object: { id: string }) => object.id);
    expect(ids).toEqual(expect.arrayContaining([`brief-${briefId}`, `artifact-${artifactId}`, "client-review"]));
    expect(JSON.stringify(data)).not.toMatch(/Outdated|approved|Secret campaign/);
  });
  it("rejects attempts to treat an image as a model or an arbitrary panel as an asset", async () => {
    expect((await save(0, { ...layout, objects: [{ id: `asset-${assetId}`, type: "model", assetId, transform }] })).status).toBe(400);
    expect((await save(0, { ...layout, objects: [{ id: "project-overview", type: "asset", assetId, transform }] })).status).toBe(400);
  });
  it("sanitizes database failures and does not claim the failed write was saved", async () => {
    await postgres.exec("CREATE FUNCTION fail_xr_write() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'secret connection detail'; END $$; CREATE TRIGGER fail_xr_write BEFORE INSERT ON xr_workspaces FOR EACH ROW EXECUTE FUNCTION fail_xr_write();");
    try {
      const response = await save();
      expect(response.status).toBe(503);
      const body = await response.json();
      expect(body).toMatchObject({ ok: false, error: { code: "SERVICE_UNAVAILABLE" } });
      expect(JSON.stringify(body)).not.toContain("secret connection detail");
      expect((await postgres.query("SELECT * FROM xr_workspaces")).rows).toEqual([]);
    } finally {
      await postgres.exec("DROP TRIGGER fail_xr_write ON xr_workspaces; DROP FUNCTION fail_xr_write()");
    }
  });
  it("enforces positive workspace versions and layout schema version in PostgreSQL", async () => {
    await expect(postgres.query("INSERT INTO xr_workspaces (project_id,version,layout) VALUES ($1,0,$2)", [projectId, JSON.stringify(layout)])).rejects.toThrow();
    await expect(postgres.query("INSERT INTO xr_workspaces (project_id,version,layout) VALUES ($1,1,'{}'::jsonb)", [projectId])).rejects.toThrow();
  });
  it("keeps saved versioned panels available after newer content arrives and reset opts into latest content", async () => {
    const oldId = "e0000000-0000-4000-8000-000000000001";
    const newId = "e0000000-0000-4000-8000-000000000002";
    await database.insert(schema.artifactVersions).values({ id: oldId, projectId, kind: "note", version: 1, payload: { kind: "note", schemaVersion: 1, text: "First note" }, authorClerkId: owner });
    const firstLayout = (await (await get()).json()).data.workspace.layout;
    expect((await save(0, firstLayout)).status).toBe(200);
    await database.insert(schema.artifactVersions).values({ id: newId, projectId, kind: "note", version: 2, payload: { kind: "note", schemaVersion: 1, text: "New note" }, authorClerkId: owner });
    const loaded = (await (await get()).json()).data;
    expect(loaded.content.artifacts[0].id).toBe(oldId);
    expect(loaded.workspace.layout).toEqual(firstLayout);
    expect((await save(1, loaded.workspace.layout)).status).toBe(200);
    const reset = await RESET(request({ expectedVersion: 2 }, "POST"), context());
    const resetLayout = (await reset.json()).data.workspace.layout;
    expect(resetLayout.objects.map((object: { id: string }) => object.id)).toContain(`artifact-${newId}`);
    expect(resetLayout.objects.map((object: { id: string }) => object.id)).not.toContain(`artifact-${oldId}`);
  });
  it("keeps saved assets inside the bounded catalog when newer uploads arrive", async () => {
    const savedLayout = { ...layout, objects: [{ id: `asset-${assetId}`, type: "asset", assetId, transform }] };
    expect((await save(0, savedLayout)).status).toBe(200);
    await database.insert(schema.assets).values(Array.from({ length: 45 }, (_, index) => ({
      id: `f0000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      projectId, ownerClerkId: owner, objectKey: `new/${index}.png`, mimeType: "image/png", byteSize: 100,
      status: "ready" as const, createdAt: new Date(Date.now() + index + 1000),
    })));
    const { data } = await (await get()).json();
    expect(data.content.assets).toHaveLength(40);
    expect(data.content.assets.map((asset: { id: string }) => asset.id)).toContain(assetId);
    expect((await save(1, savedLayout)).status).toBe(200);
  });
});
