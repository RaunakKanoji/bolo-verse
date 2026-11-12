import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const boundary = vi.hoisted(() => ({ subject: "user_asset_owner" as string | null }));
const storage = vi.hoisted(() => ({ send: vi.fn(), destroy: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: boundary.subject }) }));
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class { send = storage.send; destroy = storage.destroy; },
  GetObjectCommand: class { constructor(readonly input: unknown) {} },
}));
vi.mock("@/server/db/client", () => ({ withDatabase: <T>(operation: (db: typeof database) => Promise<T>) => operation(database) }));

import * as schema from "@/server/db/schema";
import { bootstrapPersonalWorkspace } from "@/server/db/projects";
import { GET } from "@/app/api/xr/assets/[assetId]/route";
import { MAX_PREVIEW_BYTES } from "@/lib/contracts/xr-assets";

const postgres = new PGlite();
const database = drizzle(postgres, { schema });
const owner = "user_asset_owner";
const outsider = "user_asset_outsider";
const client = "user_asset_client";
const workspaceMember = "user_asset_workspace_member";
const projectId = "d1000000-0000-4000-8000-000000000001";
const otherProjectId = "d1000000-0000-4000-8000-000000000002";
const assetId = "d2000000-0000-4000-8000-000000000001";
const otherAssetId = "d2000000-0000-4000-8000-000000000002";
const stagingAssetId = "d2000000-0000-4000-8000-000000000003";
const addedAssetId = "d2000000-0000-4000-8000-000000000004";
const png = new Uint8Array(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGMwqfj2HwAFKAKi8NmfRgAAAABJRU5ErkJggg==", "base64"));
const json = (value: unknown) => new TextEncoder().encode(JSON.stringify(value));

function storageObject(bytes: Uint8Array, contentType = "image/png") {
  return { ContentLength: bytes.length, ContentType: contentType, Body: { transformToWebStream: () => new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(bytes); controller.close(); } }) } };
}
function get(id = assetId, request = new Request(`http://localhost:3000/api/xr/assets/${id}`)) {
  return GET(request, { params: Promise.resolve({ assetId: id }) });
}
async function insertAsset(mimeType: string, bytes: number) {
  await database.insert(schema.assets).values({ id: addedAssetId, projectId, ownerClerkId: owner, objectKey: "private/verified/new-file", mimeType, byteSize: bytes, status: "ready" });
}
function glb(document: unknown) {
  const raw = JSON.stringify(document);
  const encoded = new TextEncoder().encode(raw.padEnd(Math.ceil(raw.length / 4) * 4, " "));
  const bytes = new Uint8Array(20 + encoded.length);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, bytes.length, true);
  view.setUint32(12, encoded.length, true);
  view.setUint32(16, 0x4e4f534a, true);
  bytes.set(encoded, 20);
  return bytes;
}

beforeAll(async () => {
  const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8")) as { entries: { tag: string }[] };
  for (const { tag } of journal.entries) await postgres.exec(await readFile(`drizzle/${tag}.sql`, "utf8"));
}, 30_000);
beforeEach(async () => {
  boundary.subject = owner;
  storage.send.mockReset().mockResolvedValue(storageObject(png));
  storage.destroy.mockReset();
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_configured");
  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_configured");
  vi.stubEnv("DATABASE_URL", "postgres://test");
  vi.stubEnv("R2_ACCOUNT_ID", "a".repeat(32));
  vi.stubEnv("R2_ACCESS_KEY_ID", "test-access-id");
  vi.stubEnv("R2_SECRET_ACCESS_KEY", "test-storage-secret");
  vi.stubEnv("R2_BUCKET", "test-private-bucket");
  await postgres.exec("TRUNCATE workspaces CASCADE");
  const workspace = await bootstrapPersonalWorkspace(database, owner);
  const other = await bootstrapPersonalWorkspace(database, outsider);
  await database.insert(schema.projects).values([
    { id: projectId, workspaceId: workspace.id, name: "Permitted project", objective: "Real objective", createdByClerkId: owner },
    { id: otherProjectId, workspaceId: other.id, name: "Secret project", objective: "Private objective", createdByClerkId: outsider },
  ]);
  await database.insert(schema.projectMembers).values({ projectId, clerkUserId: client, role: "client" });
  await database.insert(schema.workspaceMembers).values({ workspaceId: workspace.id, clerkUserId: workspaceMember, role: "member" });
  await database.insert(schema.assets).values([
    { id: assetId, projectId, ownerClerkId: owner, objectKey: "private/verified/authorized.png", mimeType: "image/png", byteSize: png.length, status: "ready" },
    { id: otherAssetId, projectId: otherProjectId, ownerClerkId: outsider, objectKey: "private/verified/secret.png", mimeType: "image/png", byteSize: png.length, status: "ready" },
    { id: stagingAssetId, projectId, ownerClerkId: owner, objectKey: "private/staging/unverified.png", mimeType: "image/png", byteSize: png.length, status: "staging" },
  ]);
});
afterAll(async () => { vi.unstubAllEnvs(); await postgres.close(); });

describe("private XR preview delivery with PostgreSQL authorization", () => {
  it.each([owner, client])("returns real storage bytes to authorized %s with private defensive headers", async (subject) => {
    boundary.subject = subject;
    const response = await get();
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(png);
    expect(response.headers.get("content-type")).toBe("image/png");
    // The route streams validated chunks; it does not declare a buffered length.
    expect(response.headers.get("content-length")).toBeNull();
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("content-security-policy")).toBe("default-src 'none'; sandbox");
    expect(storage.send).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ input: { Bucket: "test-private-bucket", Key: "private/verified/authorized.png" } }), expect.objectContaining({ abortSignal: expect.any(AbortSignal) }));
    expect(storage.destroy).toHaveBeenCalledOnce();
    expect(JSON.stringify([...response.headers])).not.toMatch(/objectKey|r2\.cloudflare|test-storage-secret|test-access-id|private\/verified/);
    expect((await postgres.query("SELECT count(*)::int AS count FROM upload_events")).rows).toEqual([{ count: 0 }]);
  });
  it.each([outsider, workspaceMember])("rejects %s before touching private storage", async (subject) => {
    boundary.subject = subject;
    const response = await get();
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect(storage.send).not.toHaveBeenCalled();
  });
  it.each([otherAssetId, stagingAssetId, "d2000000-0000-4000-8000-000000000099"])("treats foreign, staging and missing asset %s as inaccessible", async (id) => {
    const response = await get(id);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.message).toBe("This asset is unavailable or you do not have access.");
    expect(JSON.stringify(body)).not.toMatch(/private\/|Secret project|test-storage-secret/);
    expect(storage.send).not.toHaveBeenCalled();
  });
  it("ignores forged query context and checks the asset's real project", async () => {
    const response = await get(otherAssetId, new Request(`http://localhost:3000/api/xr/assets/${otherAssetId}?projectId=${projectId}&ownerId=${owner}`));
    expect(response.status).toBe(403);
    expect(storage.send).not.toHaveBeenCalled();
  });
  it("rechecks project membership after a pending storage read before returning private bytes", async () => {
    boundary.subject = client;
    let release!: (value: ReturnType<typeof storageObject>) => void;
    let markStarted!: () => void;
    const started = new Promise<void>(resolve => { markStarted = resolve; });
    const pending = new Promise<ReturnType<typeof storageObject>>(resolve => { release = resolve; });
    storage.send.mockImplementationOnce(() => { markStarted(); return pending; });
    const responsePromise = get();
    await started;
    await postgres.query("DELETE FROM project_members WHERE project_id=$1 AND clerk_user_id=$2", [projectId, client]);
    release(storageObject(png));
    const response = await responsePromise;
    expect(response.status).toBe(403);
    expect(response.headers.get("content-type")).toContain("application/json");
    const body = await response.json();
    expect(body).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect(JSON.stringify(body)).not.toMatch(/private\/|test-storage-secret/);
    expect(storage.destroy).toHaveBeenCalledOnce();
  });
  it("requires a valid identity and fails closed when Clerk is unconfigured", async () => {
    boundary.subject = null;
    expect((await get()).status).toBe(401);
    boundary.subject = owner;
    vi.stubEnv("CLERK_SECRET_KEY", "");
    expect((await get()).status).toBe(503);
    expect(storage.send).not.toHaveBeenCalled();
  });
  it.each(["not-a-uuid", "../../private/key", "https://example.test/file"])("rejects invalid asset ID %s", async (id) => {
    expect((await get(id)).status).toBe(400);
    expect(storage.send).not.toHaveBeenCalled();
  });
  it.each([
    { mime: "text/html", bytes: png.length },
    { mime: "image/svg+xml", bytes: png.length },
    { mime: "image/png", bytes: 0 },
    { mime: "image/png", bytes: MAX_PREVIEW_BYTES + 1 },
  ])("rejects unsupported metadata %# before downloading", async ({ mime, bytes }) => {
    await insertAsset(mime, bytes);
    expect((await get(addedAssetId)).status).toBe(415);
    expect(storage.send).not.toHaveBeenCalled();
  });
  it("rejects storage bytes that differ in length from verified metadata", async () => {
    storage.send.mockResolvedValueOnce(storageObject(new Uint8Array([...png, 0])));
    const response = await get();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: "SERVICE_UNAVAILABLE" } });
    expect(storage.destroy).toHaveBeenCalledOnce();
  });
  it("rejects mismatched image signatures even if byte count matches", async () => {
    storage.send.mockResolvedValueOnce(storageObject(new Uint8Array(png.length)));
    const response = await get();
    expect(response.status).toBe(415);
    expect(await response.json()).toMatchObject({ ok: false, error: { message: "File bytes do not match their declared type." } });
  });
  it.each(["https://remote.test/file.bin", "/api/projects", "../protected.bin", "blob:untrusted"])("rejects external model resource %s before returning any bytes", async (uri) => {
    const bytes = json({ asset: { version: "2.0" }, buffers: [{ uri, byteLength: 10 }] });
    await insertAsset("model/gltf+json", bytes.length);
    storage.send.mockResolvedValueOnce(storageObject(bytes, "model/gltf+json"));
    const response = await get(addedAssetId);
    expect(response.status).toBe(415);
    const body = await response.json();
    expect(body.error.message).toMatch(/self-contained/);
    expect(JSON.stringify(body)).not.toContain(uri);
  });
  it("validates GLB JSON resources rather than trusting its binary header", async () => {
    const bytes = glb({ asset: { version: "2.0" }, images: [{ uri: "https://remote.test/image.png" }] });
    await insertAsset("model/gltf-binary", bytes.length);
    storage.send.mockResolvedValueOnce(storageObject(bytes, "model/gltf-binary"));
    expect((await get(addedAssetId)).status).toBe(415);
  });
  it("returns a self-contained model through the same private authorization path", async () => {
    const bytes = glb({ asset: { version: "2.0" }, scenes: [{}], scene: 0 });
    await insertAsset("model/gltf-binary", bytes.length);
    storage.send.mockResolvedValueOnce(storageObject(bytes, "model/gltf-binary"));
    const response = await get(addedAssetId);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("model/gltf-binary");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
  });
  it("delivers PDF document cards as an attachment rather than an active same-origin document", async () => {
    const bytes = new TextEncoder().encode("%PDF-1.7\n%%EOF");
    await insertAsset("application/pdf", bytes.length);
    storage.send.mockResolvedValueOnce(storageObject(bytes, "application/pdf"));
    const response = await get(addedAssetId);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toBe('attachment; filename="project-document.pdf"');
    expect(response.headers.get("content-security-policy")).toContain("sandbox");
  });
  it("reports missing storage configuration without substituting demo files", async () => {
    vi.stubEnv("R2_BUCKET", "");
    const response = await get();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ ok: false, error: { code: "PROVIDER_UNCONFIGURED" } });
    expect(storage.send).not.toHaveBeenCalled();
  });
  it("sanitizes storage errors and destroys the SDK client", async () => {
    storage.send.mockRejectedValueOnce(new Error("test-storage-secret private/verified/authorized.png"));
    const response = await get();
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toMatch(/test-storage-secret|private\/verified/);
    expect(storage.destroy).toHaveBeenCalledOnce();
  });
  it("rejects an oversized declared storage body before reading it", async () => {
    const transformToWebStream = vi.fn();
    storage.send.mockResolvedValueOnce({ ContentLength: MAX_PREVIEW_BYTES + 1, Body: { transformToWebStream } });
    expect((await get()).status).toBe(413);
    expect(transformToWebStream).not.toHaveBeenCalled();
    expect(storage.destroy).toHaveBeenCalledOnce();
  });
  it("cancels a stream that exceeds the limit despite underreported storage length", async () => {
    let cancelled = false;
    storage.send.mockResolvedValueOnce({ ContentLength: png.length, ContentType: "image/png", Body: { transformToWebStream: () => new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new Uint8Array(MAX_PREVIEW_BYTES + 1)); },
      cancel() { cancelled = true; },
    }) } });
    expect((await get()).status).toBe(413);
    expect(cancelled).toBe(true);
    expect(storage.destroy).toHaveBeenCalledOnce();
  });
});
