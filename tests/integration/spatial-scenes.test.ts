import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { nativeTestPublicKey, nativeTestPublishableKey, sessionJWT } from "../helpers/native-session";
vi.mock("server-only", () => ({}));
const cookie = vi.hoisted(() => ({ subject: "cookie_owner" as string | null }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: cookie.subject }) }));
vi.mock("@/server/db/client", () => ({ withDatabase: <T>(operation: (db: typeof database) => Promise<T>) => operation(database) }));
import * as schema from "@/server/db/schema";
import { bootstrapPersonalWorkspace } from "@/server/db/projects";
import { GET, PUT } from "@/app/api/v1/projects/[projectId]/spatial-scene/route";
import { GET as GET_PROJECTS } from "@/app/api/v1/projects/route";
import { GET as GET_ASSETS } from "@/app/api/v1/projects/[projectId]/assets/route";
import { GET as GET_DRAFT, PUT as PUT_DRAFT } from "@/app/api/v1/projects/[projectId]/creative-draft/route";
import { GET as GET_CONTENT } from "@/app/api/v1/assets/[assetId]/content/route";
import { createEmptyCreativeDraftDocument } from "@/lib/contracts/shape";

const postgres = new PGlite();
const database = drizzle(postgres, { schema });
const projectId = "d1000000-0000-4000-8000-000000000001";
const otherProjectId = "d1000000-0000-4000-8000-000000000002";
const assetId = "d2000000-0000-4000-8000-000000000001";
const foreignAssetId = "d2000000-0000-4000-8000-000000000002";
const stagingAssetId = "d2000000-0000-4000-8000-000000000003";
const owner = "native_owner", editor = "native_editor", client = "native_client", outsider = "native_outsider";
const context = (id = projectId) => ({ params: Promise.resolve({ projectId: id }) });
function document(x = 0) { return { sceneId: projectId, version: 1, objects: [{ id: "product", assetId, position: [x, 0, -1], rotation: [0, 0, 0, 1], scale: [1, 1, 1], visible: true }] }; }
function request(subject = owner, body?: unknown, origin?: string) {
  const headers = new Headers({ Authorization: `Bearer ${sessionJWT(subject)}`, "Content-Type": "application/json" });
  if (origin) headers.set("Origin", origin);
  return new Request(`http://localhost:3000/api/v1/projects/${projectId}/spatial-scene`, { method: body === undefined ? "GET" : "PUT", headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
const get = (subject = owner, id = projectId) => GET(request(subject), context(id));
const save = (revision = 0, value = document(), subject = owner) => PUT(request(subject, { expectedRevision: revision, document: value }), context());
beforeAll(async () => {
  const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8")) as { entries: { tag: string }[] };
  for (const { tag } of journal.entries) await postgres.exec(await readFile(`drizzle/${tag}.sql`, "utf8"));
}, 30_000);
beforeEach(async () => {
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_configured");
  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", nativeTestPublishableKey);
  vi.stubEnv("CLERK_JWT_KEY", nativeTestPublicKey);
  vi.stubEnv("DATABASE_URL", "postgres://test");
  vi.stubEnv("ALLOWED_ORIGINS", "http://localhost:3000");
  await postgres.exec("TRUNCATE workspaces, rate_limit_buckets CASCADE");
  const workspace = await bootstrapPersonalWorkspace(database, owner);
  const other = await bootstrapPersonalWorkspace(database, outsider);
  await database.insert(schema.projects).values([
    { id: projectId, workspaceId: workspace.id, name: "Spatial project", objective: "A real scene", createdByClerkId: owner },
    { id: otherProjectId, workspaceId: other.id, name: "Other project", objective: "Private", createdByClerkId: outsider },
  ]);
  await database.insert(schema.projectMembers).values([{ projectId, clerkUserId: editor, role: "editor" }, { projectId, clerkUserId: client, role: "client" }]);
  await database.insert(schema.assets).values([
    { id: assetId, projectId, ownerClerkId: owner, objectKey: "private/model.glb", mimeType: "model/gltf-binary", byteSize: 64, status: "ready" },
    { id: foreignAssetId, projectId: otherProjectId, ownerClerkId: outsider, objectKey: "private/foreign.glb", mimeType: "model/gltf-binary", byteSize: 64, status: "ready" },
    { id: stagingAssetId, projectId, ownerClerkId: owner, objectKey: "private/staging.glb", mimeType: "model/gltf-binary", byteSize: 64, status: "staging" },
  ]);
});
afterAll(async () => { vi.unstubAllEnvs(); await postgres.close(); });

describe("native canonical scene API", () => {
  it("lists only ready project assets for an authorized editor and denies other projects", async () => {
    const response = await GET_ASSETS(request(editor), context());
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data.assets.map((asset: { id: string }) => asset.id)).toEqual([assetId]);
    expect(JSON.stringify(result)).not.toMatch(/objectKey|ownerClerkId|private\//);
    expect((await GET_ASSETS(request(editor), context(otherProjectId))).status).toBe(403);
  });
  it("returns stable empty revision zero without creating stored content", async () => {
    const response = await get();
    expect(response.status).toBe(200);
    expect((await response.json()).data.scene).toEqual({ projectId, sceneId: projectId, revision: 0, document: { sceneId: projectId, version: 1, objects: [] }, updatedAt: null, canEdit: true });
    expect((await postgres.query("SELECT * FROM spatial_scenes")).rows).toHaveLength(0);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("persists quaternion transforms and shares the scene with authorized editors and clients", async () => {
    const value = document(0.25); value.objects[0].rotation = [0, Math.SQRT1_2, 0, Math.SQRT1_2];
    expect((await save(0, value, editor)).status).toBe(200);
    const { data } = await (await get(client)).json();
    expect(data.scene).toMatchObject({ sceneId: projectId, revision: 1, document: value, canEdit: false });
    expect(data.scene.updatedAt).toEqual(expect.any(String));
    expect((await save(1, document(), client)).status).toBe(403);
    expect(JSON.stringify(data)).not.toMatch(/objectKey|ownerClerkId|private\//);
  });
  it("hides foreign and absent projects and rejects revoked editors", async () => {
    const denied = await get(outsider), absent = await get(outsider, "d1000000-0000-4000-8000-000000000099");
    expect(denied.status).toBe(403);
    expect((await denied.json()).error).toEqual((await absent.json()).error);
    expect((await save(0, document(), outsider)).status).toBe(403);
    expect((await save(0, document(), editor)).status).toBe(200);
    await postgres.query("DELETE FROM project_members WHERE clerk_user_id=$1", [editor]);
    expect((await get(editor)).status).toBe(403);
    expect((await save(1, document(), editor)).status).toBe(403);
  });
  it("preserves the winner of first-save and subsequent revision races", async () => {
    const initial = await Promise.all([save(0, document(1)), save(0, document(2))]);
    expect(initial.map(({ status }) => status).sort()).toEqual([200, 409]);
    const winner = (await initial.find(({ status }) => status === 200)!.json()).data.scene;
    expect((await (await get()).json()).data.scene.document).toEqual(winner.document);
    const updates = await Promise.all([save(1, document(3)), save(1, document(4))]);
    expect(updates.map(({ status }) => status).sort()).toEqual([200, 409]);
    expect((await (await get()).json()).data.scene.revision).toBe(2);
  });
  it("rejects foreign, staging and missing asset references without saving", async () => {
    for (const id of [foreignAssetId, stagingAssetId, "d2000000-0000-4000-8000-000000000099"]) {
      const value = document(); value.objects[0].assetId = id;
      expect((await save(0, value)).status).toBe(400);
    }
    expect((await (await get()).json()).data.scene.revision).toBe(0);
  });
  it("rejects scene identity changes, unknown fields, duplicate objects and invalid transforms", async () => {
    const base = document();
    const invalid = [
      { ...base, sceneId: otherProjectId }, { ...base, projectId: otherProjectId },
      { ...base, objects: [...base.objects, ...base.objects] },
      ...[{ rotation: [0, 0, 0, 0] }, { position: [0, 0] }, { scale: [0, 1, 1] }, { position: [31, 0, 0] }].map((change) => ({ ...base, objects: [{ ...base.objects[0], ...change }] })),
    ];
    for (const value of invalid) expect((await PUT(request(owner, { expectedRevision: 0, document: value }), context())).status).toBe(400);
    expect((await PUT(request(owner, { expectedRevision: 0, document: base, ownerId: owner }), context())).status).toBe(400);
    expect((await PUT(request(owner, { extra: "x".repeat(33000) }), context())).status).toBe(413);
    expect((await get(owner, "invalid")).status).toBe(400);
  });
  it("retains origin policy and does not accept forged native headers", async () => {
    expect((await PUT(request(owner, { expectedRevision: 0, document: document() }, "https://evil.test"), context())).status).toBe(403);
    const forged = new Request("http://localhost:3000/api/v1/projects", { headers: { Authorization: "Bearer forged", Cookie: "__session=valid-cookie" } });
    expect((await GET(forged, context())).status).toBe(401);
    expect((await GET(new Request("http://localhost:3000"), context())).status).toBe(403);
  });
  it("enforces durable write limits and leaves legacy documents untouched", async () => {
    const layout = { schemaVersion: 1, environment: "creative-studio", objects: [{ id: "project-overview", type: "panel", transform: { position: [0, 1, -3], rotation: [10, 20, 30], scale: [1, 1, 1] } }] };
    await postgres.query("INSERT INTO xr_workspaces(project_id,version,layout) VALUES($1,1,$2::jsonb)", [projectId, JSON.stringify(layout)]);
    expect((await save()).status).toBe(200);
    const keyHash = createHash("sha256").update(`spatial-scene-save:${owner}`).digest("hex");
    await postgres.query("UPDATE rate_limit_buckets SET count=60 WHERE key_hash=$1", [keyHash]);
    expect((await save(1)).status).toBe(429);
    expect((await postgres.query("SELECT layout,version FROM xr_workspaces")).rows).toEqual([{ layout, version: 1 }]);
    expect((await postgres.query("SELECT * FROM scene_state")).rows).toHaveLength(0);
  });
  it("uses the same bearer identity for projects, assets, drafts and content authorization", async () => {
    const listed = await GET_PROJECTS(request());
    expect(listed.status).toBe(200);
    expect((await listed.json()).data.projects.map((p: { id: string }) => p.id)).toEqual([projectId]);
    expect((await GET_ASSETS(request(outsider), context())).status).toBe(403);
    expect((await PUT_DRAFT(request(owner, { expectedRevision: 0, document: createEmptyCreativeDraftDocument() }), context())).status).toBe(200);
    expect((await GET_DRAFT(request(outsider), context())).status).toBe(403);
    expect((await GET_CONTENT(request(outsider), { params: Promise.resolve({ assetId }) })).status).toBe(403);
  });
});
