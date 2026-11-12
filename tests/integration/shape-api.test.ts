import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const boundary = vi.hoisted(() => ({ subject: "shape_owner" as string | null }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: boundary.subject }) }));
vi.mock("@/server/db/client", () => ({ withDatabase: <T>(operation: (db: typeof database) => Promise<T>) => operation(database) }));

import * as schema from "@/server/db/schema";
import { bootstrapPersonalWorkspace } from "@/server/db/projects";
import { createEmptyCreativeDraftDocument, CreativeDraftResponseSchema, ProjectListResponseSchema, AssetListResponseSchema } from "@/lib/contracts/shape";
import { MAX_PREVIEW_BYTES } from "@/lib/contracts/xr-assets";
import { GET as LIST_PROJECTS, POST as CREATE_PROJECT } from "@/app/api/v1/projects/route";
import { GET as GET_PROJECT, PATCH as UPDATE_PROJECT } from "@/app/api/v1/projects/[projectId]/route";
import { GET as GET_ASSETS } from "@/app/api/v1/projects/[projectId]/assets/route";
import { GET as GET_DRAFT, PUT as SAVE_DRAFT } from "@/app/api/v1/projects/[projectId]/creative-draft/route";
import { GET as GET_CAPABILITIES } from "@/app/api/v1/capabilities/route";
import { GET as GET_ASSET_CONTENT } from "@/app/api/v1/assets/[assetId]/content/route";

const postgres = new PGlite();
const database = drizzle(postgres, { schema });
const owner = "shape_owner";
const editor = "shape_editor";
const client = "shape_client";
const outsider = "shape_outsider";
const projectId = "b1000000-0000-4000-8000-000000000001";
const otherProjectId = "b1000000-0000-4000-8000-000000000002";
const assetId = "c1000000-0000-4000-8000-000000000001";
const otherAssetId = "c1000000-0000-4000-8000-000000000002";
const stagingAssetId = "c1000000-0000-4000-8000-000000000003";
const context = (id = projectId) => ({ params: Promise.resolve({ projectId: id }) });
const read = () => new Request(`http://localhost:3000/api/v1/projects/${projectId}`);
function write(body: unknown, method = "PUT", origin = "http://localhost:3000") {
  return new Request(`http://localhost:3000/api/v1/projects/${projectId}`, { method, headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(body) });
}
function draft(prompt = "A thoughtful image") { const document = createEmptyCreativeDraftDocument(); document.prompts.image = prompt; return document; }
const get = (id = projectId) => GET_DRAFT(read(), context(id));
const save = (expectedRevision = 0, document = draft()) => SAVE_DRAFT(write({ expectedRevision, document }), context());

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
    { id: projectId, workspaceId: workspace.id, name: "Creative campaign", objective: "Our objective", createdByClerkId: owner },
    { id: otherProjectId, workspaceId: other.id, name: "Other campaign", objective: "Private objective", createdByClerkId: outsider },
  ]);
  await database.insert(schema.projectMembers).values([
    { projectId, clerkUserId: editor, role: "editor" },
    { projectId, clerkUserId: client, role: "client" },
  ]);
  await database.insert(schema.assets).values([
    { id: assetId, projectId, ownerClerkId: owner, objectKey: "private/one.png", mimeType: "image/png", byteSize: 8, status: "ready" },
    { id: otherAssetId, projectId: otherProjectId, ownerClerkId: outsider, objectKey: "private/two.png", mimeType: "image/png", byteSize: 8, status: "ready" },
    { id: stagingAssetId, projectId, ownerClerkId: owner, objectKey: "private/pending.png", mimeType: "image/png", byteSize: 8, status: "staging" },
  ]);
});
afterAll(async () => { vi.unstubAllEnvs(); await postgres.close(); });

describe("versioned Shape API", () => {
  it("serves truthful public capabilities without requiring a configured account", async () => {
    boundary.subject = null;
    vi.stubEnv("DATABASE_URL", "");
    const response = await GET_CAPABILITIES();
    expect(response.status).toBe(200);
    expect((await response.json()).data.modes.every((mode: { availability: string }) => mode.availability === "not_implemented")).toBe(true);
  });
  it("projects safe authorized project fields on reads, creates and updates", async () => {
    const result = ProjectListResponseSchema.parse(await (await LIST_PROJECTS(read())).json());
    expect(result.data.projects.map((project) => project.id)).toEqual([projectId]);
    expect(Object.keys(result.data.projects[0]).sort()).toEqual(["createdAt", "id", "name", "objective", "sample"]);
    const created = await CREATE_PROJECT(write({ name: "New project", objective: "A new campaign" }, "POST"));
    expect(created.status).toBe(201);
    expect(Object.keys((await created.json()).data.project).sort()).toEqual(["createdAt", "id", "name", "objective", "sample"]);
    const updated = await UPDATE_PROJECT(write({ name: "Updated" }, "PATCH"), context());
    expect(updated.status).toBe(200);
    expect((await updated.json()).data.project.name).toBe("Updated");
    boundary.subject = client;
    expect((await GET_PROJECT(read(), context())).status).toBe(200);
    expect((await UPDATE_PROJECT(write({ name: "Forbidden" }, "PATCH"), context())).status).toBe(403);
  });
  it("lists only ready assets within the authorized project without private object or identity fields", async () => {
    const result = AssetListResponseSchema.parse(await (await GET_ASSETS(read(), context())).json());
    expect(result.data.assets.map((asset) => asset.id)).toEqual([assetId]);
    expect(result.data.assets[0].contentUrl).toBe(`/api/v1/assets/${assetId}/content`);
    expect(JSON.stringify(result)).not.toMatch(/private\/|objectKey|ownerClerkId|uploadGrantId|checksum/);
    expect((await GET_ASSETS(read(), context(otherProjectId))).status).toBe(403);
  });
  it("retains asset content authorization, readiness and ID validation on the versioned URL", async () => {
    const content = (id: string) => GET_ASSET_CONTENT(read(), { params: Promise.resolve({ assetId: id }) });
    expect((await content(otherAssetId)).status).toBe(403);
    expect((await content(stagingAssetId)).status).toBe(403);
    expect((await content("invalid")).status).toBe(400);
    boundary.subject = null;
    expect((await content(assetId)).status).toBe(401);
  });
  it("distinguishes an authorized empty asset library from a forbidden project", async () => {
    const created = await CREATE_PROJECT(write({ name: "Empty project", objective: "No media yet" }, "POST"));
    const emptyId = (await created.json()).data.project.id;
    const response = await GET_ASSETS(read(), context(emptyId));
    expect(response.status).toBe(200);
    expect((await response.json()).data).toEqual({ assets: [], hasMore: false });
  });
  it.each([
    { mimeType: "audio/wav", byteSize: 512 },
    { mimeType: "model/vnd.usdz+zip", byteSize: 512 },
    { mimeType: "image/png", byteSize: MAX_PREVIEW_BYTES + 1 },
    { mimeType: "image/png", byteSize: 0 },
  ])("retains metadata without advertising unsupported preview URLs: $mimeType/$byteSize", async ({ mimeType, byteSize }) => {
    const [asset] = await database.insert(schema.assets).values({ projectId, ownerClerkId: owner, objectKey: "private/unsupported", mimeType, byteSize, status: "ready" }).returning();
    const { data } = await (await GET_ASSETS(read(), context())).json();
    expect(data.assets.find((item: { id: string }) => item.id === asset.id)).toMatchObject({ id: asset.id, mimeType, byteSize, contentUrl: null });
    const response = await GET_ASSET_CONTENT(read(), { params: Promise.resolve({ assetId: asset.id }) });
    expect(response.status).toBe(415);
  });
  it("keeps asset lists bounded and signals additional rows", async () => {
    await database.insert(schema.assets).values(Array.from({ length: 101 }, (_, index) => ({ projectId, ownerClerkId: owner, objectKey: `private/batch-${index}.png`, mimeType: "image/png", byteSize: 1, status: "ready" as const })));
    const { data } = await (await GET_ASSETS(read(), context())).json();
    expect(data.assets).toHaveLength(100);
    expect(data.hasMore).toBe(true);
  });
  it("returns revision zero without persisting a synthetic draft or generation", async () => {
    const response = await get();
    const { data } = CreativeDraftResponseSchema.parse(await response.json());
    expect(data.draft).toEqual({ projectId, revision: 0, document: createEmptyCreativeDraftDocument(), updatedAt: null, canEdit: true });
    expect((await postgres.query("SELECT * FROM creative_drafts")).rows).toEqual([]);
    expect((await postgres.query("SELECT * FROM processing_jobs")).rows).toEqual([]);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("stores private per-user drafts and preserves independent modes in the same project", async () => {
    const document = { ...draft("Owner image"), mode: "video" as const, prompts: { image: "Owner image", video: "Owner video", audio: "Owner audio", model3d: "Owner model" } };
    expect((await save(0, document)).status).toBe(200);
    boundary.subject = editor;
    expect((await (await get()).json()).data.draft.document.prompts.image).toBe("");
    expect((await save(0, draft("Editor image"))).status).toBe(200);
    boundary.subject = owner;
    const saved = (await (await get()).json()).data.draft;
    expect(saved.document).toEqual(document);
    expect(saved.revision).toBe(1);
    expect(saved.updatedAt).toEqual(expect.any(String));
    expect((await postgres.query("SELECT * FROM creative_drafts")).rows).toHaveLength(2);
  });
  it("denies cross-project reads and writes and treats missing IDs identically", async () => {
    boundary.subject = outsider;
    const denied = await get();
    const missing = await get("b1000000-0000-4000-8000-000000000099");
    expect(denied.status).toBe(403);
    expect((await denied.json()).error).toEqual((await missing.json()).error);
    expect((await save()).status).toBe(403);
  });
  it("allows a client to read only their empty draft and rejects their writes", async () => {
    await save();
    boundary.subject = client;
    const { data } = await (await get()).json();
    expect(data.draft.canEdit).toBe(false);
    expect(data.draft.document.prompts.image).toBe("");
    expect((await save()).status).toBe(403);
  });
  it("rejects revoked membership at both read and write boundaries", async () => {
    boundary.subject = editor;
    await save();
    await postgres.query("DELETE FROM project_members WHERE project_id=$1 AND clerk_user_id=$2", [projectId, editor]);
    expect((await get()).status).toBe(403);
    expect((await save(1)).status).toBe(403);
  });
  it("first-save and subsequent update races preserve exactly one winning revision", async () => {
    const first = await Promise.all([save(0, draft("First")), save(0, draft("Second"))]);
    expect(first.map((response) => response.status).sort()).toEqual([200, 409]);
    const winner = (await first.find((response) => response.status === 200)!.json()).data.draft;
    expect((await (await get()).json()).data.draft.document).toEqual(winner.document);
    const next = await Promise.all([save(1, draft("Third")), save(1, draft("Fourth"))]);
    expect(next.map((response) => response.status).sort()).toEqual([200, 409]);
    expect((await (await get()).json()).data.draft.revision).toBe(2);
    expect((await save(0)).status).toBe(409);
  });
  it("requires identity, configuration and an exact trusted mutation origin", async () => {
    expect((await SAVE_DRAFT(write({ expectedRevision: 0, document: draft() }, "PUT", "https://evil.test"), context())).status).toBe(403);
    boundary.subject = null;
    expect((await get()).status).toBe(401);
    expect((await save()).status).toBe(401);
    vi.stubEnv("DATABASE_URL", "");
    expect((await get()).status).toBe(503);
  });
  it("rejects invalid fields, foreign ownership, IDs and oversized bodies before persistence", async () => {
    expect((await get("bad-id")).status).toBe(400);
    for (const body of [
      { expectedRevision: -1, document: draft() },
      { expectedRevision: 0, document: draft(), ownerClerkId: editor },
      { expectedRevision: 0, document: { ...draft(), projectId: otherProjectId } },
      { expectedRevision: 0, document: draft("x".repeat(2001)) },
    ]) expect((await SAVE_DRAFT(write(body), context())).status).toBe(400);
    expect((await SAVE_DRAFT(write({ extra: "x".repeat(33000) }), context())).status).toBe(413);
    expect((await postgres.query("SELECT * FROM creative_drafts")).rows).toEqual([]);
  });
  it("accepts full-length multilingual prompts without weakening the default project body limit", async () => {
    const document = draft();
    for (const mode of ["image", "video", "audio", "model3d"] as const) document.prompts[mode] = "界".repeat(2000);
    expect((await save(0, document)).status).toBe(200);
    expect((await CREATE_PROJECT(write({ extra: "x".repeat(17000) }, "POST"))).status).toBe(413);
  });
  it("enforces a durable account-level write budget and renews expired buckets", async () => {
    const keyHash = createHash("sha256").update(`creative-draft-save:${owner}`).digest("hex");
    await postgres.query("INSERT INTO rate_limit_buckets(key_hash,window_start,count,expires_at) VALUES ($1,now(),60,now()+interval '1 minute')", [keyHash]);
    expect((await save()).status).toBe(429);
    expect((await postgres.query("SELECT * FROM creative_drafts")).rows).toEqual([]);
    await postgres.query("UPDATE rate_limit_buckets SET expires_at=now()-interval '1 second' WHERE key_hash=$1", [keyHash]);
    expect((await save()).status).toBe(200);
  });
  it("makes review decisions append-only while allowing a new decision to retain history", async () => {
    const outputId = "d1000000-0000-4000-8000-000000000001";
    await postgres.query("INSERT INTO content_versions(id,project_id,version,source_snapshot,author_clerk_id) VALUES ($1,$2,1,'{}'::jsonb,$3)", [outputId, projectId, owner]);
    const [decision] = await database.insert(schema.reviewDecisions).values({ projectId, contentVersionId: outputId, reviewerClerkId: client, decision: "changes_requested", reason: "Initial feedback" }).returning();
    await expect(postgres.query("UPDATE review_decisions SET decision='approved' WHERE id=$1", [decision.id])).rejects.toThrow(/immutable/i);
    await expect(postgres.query("DELETE FROM review_decisions WHERE id=$1", [decision.id])).rejects.toThrow(/immutable/i);
    await database.insert(schema.reviewDecisions).values({ projectId, contentVersionId: outputId, reviewerClerkId: client, decision: "approved" });
    expect((await postgres.query("SELECT * FROM review_decisions")).rows).toHaveLength(2);
  });
});
