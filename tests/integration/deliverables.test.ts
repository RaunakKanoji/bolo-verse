import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { nativeTestPublicKey, nativeTestPublishableKey, sessionJWT } from "../helpers/native-session";
vi.mock("server-only", () => ({}));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: null }) }));
const storage = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock("@/server/providers/r2-ingestion", () => ({ readStagedImage: storage.read }));
vi.mock("@/server/db/client", () => ({ withDatabase: <T>(fn: (db: typeof database) => Promise<T>) => fn(database) }));
import * as schema from "@/server/db/schema";
import { bootstrapPersonalWorkspace } from "@/server/db/projects";
import { createAssetUploadSession, completeImageUpload } from "@/server/db/asset-ingestions";
import { GET, POST } from "@/app/api/v1/projects/[projectId]/deliverables/route";
import { GET as DETAIL } from "@/app/api/v1/projects/[projectId]/deliverables/[deliverableId]/route";
import { BoundaryError } from "@/server/auth/errors";
const statements: string[] = [];
const postgres = new PGlite(), database = drizzle(postgres, { schema, logger: { logQuery(query) { statements.push(query); } } });
const projectId = "c1000000-0000-4000-8000-000000000001", otherId = "c1000000-0000-4000-8000-000000000002";
const owner = "publication_owner", editor = "publication_editor", client = "publication_client", outsider = "publication_outsider";
const bytes = new Uint8Array(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVQImWMwMjL6DwACxgGWgWwZRAAAAABJRU5ErkJggg==", "base64"));
const checksum = createHash("sha256").update(bytes).digest("hex");
let assetId = "";
function request(subject = owner, body?: unknown) { return new Request(`http://localhost:3000/api/v1/projects/${projectId}/deliverables`, { method: body === undefined ? "GET" : "POST", headers: { Authorization: `Bearer ${sessionJWT(subject)}`, "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); }
const context = (id = projectId) => ({ params: Promise.resolve({ projectId: id }) });
const input = (patch = {}) => ({ assetId, title: "Poster one", idempotencyKey: randomUUID(), ...patch });
const publish = (body = input(), subject = owner, id = projectId) => POST(request(subject, body), context(id));
const list = (subject = owner, id = projectId) => GET(request(subject), context(id));
beforeAll(async () => { const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8")); for (const { tag } of journal.entries) await postgres.exec(await readFile(`drizzle/${tag}.sql`, "utf8")); }, 30_000);
beforeEach(async () => {
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_configured"); vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", nativeTestPublishableKey); vi.stubEnv("CLERK_JWT_KEY", nativeTestPublicKey); vi.stubEnv("DATABASE_URL", "postgres://test");
  await postgres.exec("TRUNCATE workspaces, rate_limit_buckets CASCADE");
  const workspace = await bootstrapPersonalWorkspace(database, owner), other = await bootstrapPersonalWorkspace(database, outsider);
  await database.insert(schema.projects).values([{ id: projectId, workspaceId: workspace.id, name: "Publication", objective: "Private poster", createdByClerkId: owner }, { id: otherId, workspaceId: other.id, name: "Other", objective: "Private", createdByClerkId: outsider }]);
  await database.insert(schema.projectMembers).values([{ projectId, clerkUserId: editor, role: "editor" }, { projectId, clerkUserId: client, role: "client" }]);
  const upload = await createAssetUploadSession(owner, { projectId, fileName: "poster.png", mimeType: "image/png", byteSize: bytes.length, checksumSha256: checksum, idempotencyKey: randomUUID() });
  assetId = (await completeImageUpload(owner, upload.id, { width: 1, height: 1 })).id;
  storage.read.mockReset().mockResolvedValue({ bytes, mimeType: "image/png" });
});
afterAll(async () => { vi.unstubAllEnvs(); await postgres.close(); });
describe("immutable image publication", () => {
  it("publishes exact verified uploaded bytes with server provenance and safe history/detail", async () => {
    const response = await publish(input({ caption: "Approved for discussion" }), editor);
    expect(response.status).toBe(201);
    const { data: { deliverable } } = await response.json();
    expect(deliverable).toMatchObject({ version: 1, status: "published", title: "Poster one", source: { schemaVersion: 2, sourceType: "uploaded_image", checksumSha256: checksum, assetId } });
    expect(JSON.stringify(deliverable)).not.toMatch(/creatorId|authorClerkId|objectKey|private\/|staging\//);
    const rows = await database.select().from(schema.contentVersions);
    expect(rows[0]).toMatchObject({ status: "ready", assetId, authorClerkId: editor, sourceSnapshot: { creatorId: editor } });
    expect((await (await list()).json()).data.deliverables[0]).toEqual(deliverable);
    const detail = await DETAIL(request(), { params: Promise.resolve({ projectId, deliverableId: deliverable.deliverableId }) });
    expect((await detail.json()).data.deliverable).toEqual(deliverable);
    expect(await database.select().from(schema.accessGrants)).toHaveLength(0);
    expect(await database.select().from(schema.reviewDecisions)).toHaveLength(0);
  });
  it("returns the same old publication on retry after later publications and conflicts on changed reuse", async () => {
    const body = input();
    const first = (await (await publish(body)).json()).data;
    expect((await publish(input({ title: "Poster two" }))).status).toBe(201);
    expect((await (await publish(body)).json()).data).toEqual(first);
    expect((await publish({ ...body, title: "Changed" })).status).toBe(409);
    expect((await publish(body, editor)).status).toBe(409);
    expect(await database.select().from(schema.contentVersions)).toHaveLength(2);
    expect(storage.read).toHaveBeenCalledTimes(2);
  });
  it("serializes concurrent versions and collapses concurrent duplicate keys", async () => {
    const responses = await Promise.all([publish(input()), publish(input({ title: "Two" }))]);
    expect(responses.map((response) => response.status)).toEqual([201, 201]);
    expect((await Promise.all(responses.map((response) => response.json()))).map((result) => result.data.deliverable.version).sort()).toEqual([1, 2]);
    const body = input({ title: "Three" });
    const duplicates = await Promise.all([publish(body), publish(body)]);
    expect((await Promise.all(duplicates.map((response) => response.json()))).map((result) => result.data.deliverable.deliverableId)).toEqual([body.idempotencyKey, body.idempotencyKey]);
    expect(await database.select().from(schema.contentVersions)).toHaveLength(3);
  });
  it("denies clients/foreign projects and adds no reviewer grant by publishing", async () => {
    for (const subject of [client, outsider]) { expect((await publish(input(), subject)).status).toBe(403); expect((await list(subject)).status).toBe(403); }
    expect((await publish(input(), owner, otherId)).status).toBe(403);
    expect(storage.read).not.toHaveBeenCalled();
  });
  it("rejects non-ready/missing/foreign/unverified ready assets before storage reads", async () => {
    const pending = await createAssetUploadSession(owner, { projectId, fileName: "pending.png", mimeType: "image/png", byteSize: bytes.length, checksumSha256: checksum, idempotencyKey: randomUUID() });
    const unverified = randomUUID();
    await database.insert(schema.assets).values({ id: unverified, projectId, ownerClerkId: owner, objectKey: "private/generated/unverified", mimeType: "image/png", byteSize: bytes.length, width: 1, height: 1, checksumSha256: checksum, status: "ready" });
    const foreign = await createAssetUploadSession(outsider, { projectId: otherId, fileName: "foreign.png", mimeType: "image/png", byteSize: bytes.length, checksumSha256: checksum, idempotencyKey: randomUUID() });
    await completeImageUpload(outsider, foreign.id, { width: 1, height: 1 });
    for (const id of [pending.assetId, randomUUID(), unverified, foreign.assetId]) expect((await publish(input({ assetId: id }))).status).toBe(400);
    expect(storage.read).not.toHaveBeenCalled();
  });
  it("rejects missing/changed object bytes and never creates a content row", async () => {
    storage.read.mockRejectedValueOnce(new BoundaryError(409, "CONFLICT", "Image is unavailable."));
    expect((await publish()).status).toBe(409);
    const changed = bytes.slice(); changed[45] ^= 1;
    storage.read.mockResolvedValueOnce({ bytes: changed, mimeType: "image/png" });
    expect((await publish()).status).toBe(400);
    expect(await database.select().from(schema.contentVersions)).toHaveLength(0);
  });
  it("rechecks editor permission after private storage latency", async () => {
    let release!: (value: { bytes: Uint8Array; mimeType: string }) => void;
    let started!: () => void;
    const begun = new Promise<void>((resolve) => { started = resolve; });
    storage.read.mockImplementationOnce(() => { started(); return new Promise((resolve) => { release = resolve; }); });
    const response = publish(input(), editor); await begun;
    await postgres.query("DELETE FROM project_members WHERE clerk_user_id=$1", [editor]);
    release({ bytes, mimeType: "image/png" });
    expect((await response).status).toBe(403);
    expect(await database.select().from(schema.contentVersions)).toHaveLength(0);
  });
  it("keeps published versions, referenced asset identity and decisions immutable", async () => {
    const body = input(); expect((await publish(body)).status).toBe(201);
    await expect(postgres.query("UPDATE content_versions SET source_snapshot='{}' WHERE id=$1", [body.idempotencyKey])).rejects.toThrow(/immutable/i);
    await expect(postgres.query("DELETE FROM content_versions WHERE id=$1", [body.idempotencyKey])).rejects.toThrow(/immutable/i);
    await expect(postgres.query("UPDATE assets SET checksum_sha256=$1 WHERE id=$2", ["a".repeat(64), assetId])).rejects.toThrow(/immutable/i);
    await expect(postgres.query("DELETE FROM assets WHERE id=$1", [assetId])).rejects.toThrow();
    await database.insert(schema.reviewDecisions).values({ projectId, contentVersionId: body.idempotencyKey, reviewerClerkId: client, decision: "changes_requested" });
    await expect(postgres.query("UPDATE review_decisions SET decision='approved'")).rejects.toThrow(/immutable|append/i);
  });
  it("validates optional source links and never invents a scene render", async () => {
    expect((await publish(input({ briefVersion: 1 }))).status).toBe(409);
    expect((await publish(input({ sceneRevision: 1 }))).status).toBe(409);
    await database.insert(schema.briefVersions).values({ projectId, version: 1, payload: {} as never, authorClerkId: owner });
    await database.insert(schema.spatialScenes).values({ projectId, sceneId: projectId, revision: 2, document: { sceneId: projectId, version: 1, objects: [] } });
    const response = await publish(input({ briefVersion: 1, sceneRevision: 2 }));
    expect(response.status).toBe(201);
    expect((await response.json()).data.deliverable.source).toMatchObject({ briefVersion: 1, sceneRevision: 2, sceneRelation: "context_only" });
    expect((await publish(input({ sceneRevision: 1 }))).status).toBe(409);
  });
  it("holds a database share lock on scene context through the final publication insert", async () => {
    await database.insert(schema.spatialScenes).values({ projectId, sceneId: projectId, revision: 2, document: { sceneId: projectId, version: 1, objects: [] } });
    statements.length = 0;
      expect((await publish(input({ sceneRevision: 2 }))).status).toBe(201);
      // PGlite queues transactions; assert the actual PostgreSQL locking clause,
      // rather than claim a second live connection was interleaved here.
      expect(statements.filter((sql) => /spatial_scenes/is.test(sql))).toEqual(expect.arrayContaining([expect.stringMatching(/for share/is)]));
  });
  it("enforces identity, Origin, strict fields and bounded bodies", async () => {
    for (const patch of [{ title: "" }, { creatorId: owner }, { sourceType: "scene" }, { objectKey: "forged" }]) expect((await publish(input(patch))).status).toBe(400);
    const hostile = request(owner, input()); hostile.headers.set("Origin", "https://foreign.test"); expect((await POST(hostile, context())).status).toBe(403);
    const anonymous = request(owner, input()); anonymous.headers.delete("Authorization"); expect((await POST(anonymous, context())).status).toBe(401);
    expect((await publish(input({ caption: "x".repeat(17000) }))).status).toBe(413);
  });
  it("limits new verification attempts while leaving exact successful retries available", async () => {
    const body = input(); expect((await publish(body)).status).toBe(201);
    const keyHash = createHash("sha256").update(`deliverable-publish:${owner}`).digest("hex");
    await postgres.query("UPDATE rate_limit_buckets SET count=20 WHERE key_hash=$1", [keyHash]);
    expect((await publish(body)).status).toBe(201);
    expect((await publish(input())).status).toBe(429);
    expect(storage.read).toHaveBeenCalledTimes(1);
    expect(await database.select().from(schema.contentVersions)).toHaveLength(1);
  });
  it("sanitizes storage exceptions without inventing a published version", async () => {
    storage.read.mockRejectedValueOnce(new Error("secret-key private/images/source"));
    const response = await publish(); expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toMatch(/secret-key|private\/images/);
    expect(await database.select().from(schema.contentVersions)).toHaveLength(0);
  });
});
