import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { nativeTestPublicKey, nativeTestPublishableKey, sessionJWT } from "../helpers/native-session";
import { storedUSDZ } from "../helpers/usdz";
vi.mock("server-only", () => ({}));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: null }) }));
const storage = vi.hoisted(() => ({ send: vi.fn(), destroy: vi.fn() }));
vi.mock("@aws-sdk/client-s3", () => ({ S3Client: class { send = storage.send; destroy = storage.destroy; }, GetObjectCommand: class { constructor(readonly input: unknown) {} } }));
vi.mock("@/server/db/client", () => ({ withDatabase: <T>(operation: (db: typeof database) => Promise<T>) => operation(database) }));
import * as schema from "@/server/db/schema";
import { bootstrapPersonalWorkspace } from "@/server/db/projects";
import { MAX_NATIVE_CONTENT_BYTES } from "@/lib/contracts/native-assets";
import { GET } from "@/app/api/v1/assets/[assetId]/native-content/route";
import { GET as ASSETS } from "@/app/api/v1/projects/[projectId]/assets/route";
const postgres = new PGlite(), database = drizzle(postgres, { schema });
const projectId = "e1000000-0000-4000-8000-000000000001", otherProjectId = "e1000000-0000-4000-8000-000000000002";
const assetId = "e2000000-0000-4000-8000-000000000001", otherAssetId = "e2000000-0000-4000-8000-000000000002", pendingId = "e2000000-0000-4000-8000-000000000003";
const owner = "native_asset_owner", client = "native_asset_client", outsider = "native_asset_outsider";
const bytes = storedUSDZ().bytes;
const checksum = createHash("sha256").update(bytes).digest("hex");
function object(value: Uint8Array) { return { ContentLength: value.length, Body: { transformToWebStream: () => new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(value); controller.close(); } }) } }; }
function request(subject = owner) { return new Request(`http://localhost:3000/api/v1/assets/${assetId}/native-content`, { headers: { Authorization: `Bearer ${sessionJWT(subject)}` } }); }
const get = (subject = owner, id = assetId) => GET(request(subject), { params: Promise.resolve({ assetId: id }) });
beforeAll(async () => {
  const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8")) as { entries: { tag: string }[] };
  for (const { tag } of journal.entries) await postgres.exec(await readFile(`drizzle/${tag}.sql`, "utf8"));
}, 30_000);
beforeEach(async () => {
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_configured"); vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", nativeTestPublishableKey); vi.stubEnv("CLERK_JWT_KEY", nativeTestPublicKey); vi.stubEnv("DATABASE_URL", "postgres://test");
  vi.stubEnv("R2_ACCOUNT_ID", "a".repeat(32)); vi.stubEnv("R2_ACCESS_KEY_ID", "test-id"); vi.stubEnv("R2_SECRET_ACCESS_KEY", "test-secret"); vi.stubEnv("R2_BUCKET", "private-assets");
  storage.send.mockReset().mockResolvedValue(object(bytes)); storage.destroy.mockReset();
  await postgres.exec("TRUNCATE workspaces CASCADE");
  const workspace = await bootstrapPersonalWorkspace(database, owner), other = await bootstrapPersonalWorkspace(database, outsider);
  await database.insert(schema.projects).values([{ id: projectId, workspaceId: workspace.id, name: "Project", objective: "Native model", createdByClerkId: owner }, { id: otherProjectId, workspaceId: other.id, name: "Private", objective: "Foreign", createdByClerkId: outsider }]);
  await database.insert(schema.projectMembers).values({ projectId, clerkUserId: client, role: "client" });
  await database.insert(schema.assets).values([
    { id: assetId, projectId, ownerClerkId: owner, objectKey: "private/model.usdz", mimeType: "model/vnd.usdz+zip", byteSize: bytes.length, checksumSha256: checksum, status: "ready" },
    { id: otherAssetId, projectId: otherProjectId, ownerClerkId: outsider, objectKey: "private/other.usdz", mimeType: "model/vnd.usdz+zip", byteSize: bytes.length, status: "ready" },
    { id: pendingId, projectId, ownerClerkId: owner, objectKey: "private/pending.usdz", mimeType: "model/vnd.usdz+zip", byteSize: bytes.length, status: "staging" },
  ]);
});
afterAll(async () => { vi.unstubAllEnvs(); await postgres.close(); });
describe("authorized native USDZ delivery", () => {
  it.each([owner, client])("delivers validated private bytes for authorized %s", async (subject) => {
    const response = await get(subject);
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array(bytes));
    expect(response.headers.get("content-type")).toBe("model/vnd.usdz+zip");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-disposition")).toBe('attachment; filename="project-model.usdz"');
    expect(storage.destroy).toHaveBeenCalledOnce();
  });
  it("exposes a native URL without browser USDZ support or storage keys", async () => {
    const response = await ASSETS(request(), { params: Promise.resolve({ projectId }) });
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data.assets[0]).toMatchObject({ id: assetId, nativeContentUrl: `/api/v1/assets/${assetId}/native-content`, contentUrl: null });
    expect(JSON.stringify(result)).not.toMatch(/objectKey|private\/|checksum|test-secret/);
  });
  it("denies outsiders, foreign/staging/absent IDs and invalid identities before storage", async () => {
    expect((await get(outsider)).status).toBe(403);
    for (const id of [otherAssetId, pendingId, "e2000000-0000-4000-8000-000000000099"]) expect((await get(owner, id)).status).toBe(403);
    expect((await get(owner, "invalid")).status).toBe(400);
    expect((await GET(new Request("http://localhost:3000", { headers: { Authorization: "Bearer forged" } }), { params: Promise.resolve({ assetId }) })).status).toBe(401);
    expect(storage.send).not.toHaveBeenCalled();
  });
  it("rechecks membership after storage awaits and never returns revoked private bytes", async () => {
    let release!: (result: ReturnType<typeof object>) => void, started!: () => void;
    const pending = new Promise<ReturnType<typeof object>>((resolve) => { release = resolve; });
    const begun = new Promise<void>((resolve) => { started = resolve; });
    storage.send.mockImplementationOnce(() => { started(); return pending; });
    const result = get(client); await begun;
    await postgres.query("DELETE FROM project_members WHERE clerk_user_id=$1", [client]);
    release(object(bytes));
    expect((await result).status).toBe(403);
    expect(storage.destroy).toHaveBeenCalledOnce();
  });
  it("rejects altered or truncated bytes and invalid archive contents", async () => {
    storage.send.mockResolvedValueOnce(object(bytes.subarray(0, bytes.length - 1)));
    expect((await get()).status).toBe(503);
    const changed = Buffer.from(bytes); changed[40] ^= 1;
    storage.send.mockResolvedValueOnce(object(changed));
    expect((await get()).status).toBe(503);
    const invalid = storedUSDZ([{ name: "../root.usda", bytes: new Uint8Array() }]).bytes;
    const [asset] = await database.insert(schema.assets).values({ projectId, ownerClerkId: owner, objectKey: "private/invalid.usdz", mimeType: "model/vnd.usdz+zip", byteSize: invalid.length, status: "ready" }).returning();
    storage.send.mockResolvedValueOnce(object(invalid));
    expect((await get(owner, asset.id)).status).toBe(415);
  });
  it("rejects unsupported or oversized metadata without advertising a native URL", async () => {
    for (const value of [{ mimeType: "model/gltf-binary", byteSize: 10 }, { mimeType: "model/vnd.usdz+zip", byteSize: MAX_NATIVE_CONTENT_BYTES + 1 }]) {
      const [asset] = await database.insert(schema.assets).values({ projectId, ownerClerkId: owner, objectKey: `private/${value.mimeType}/${value.byteSize}`, status: "ready", ...value }).returning();
      expect((await get(owner, asset.id)).status).toBe(415);
      const result = await (await ASSETS(request(), { params: Promise.resolve({ projectId }) })).json();
      expect(result.data.assets.find((item: { id: string }) => item.id === asset.id).nativeContentUrl).toBeNull();
    }
    expect(storage.send).not.toHaveBeenCalled();
  });
  it("cancels a body that exceeds its read limit and sanitizes storage failures", async () => {
    let cancelled = false;
    storage.send.mockResolvedValueOnce({ ContentLength: bytes.length, Body: { transformToWebStream: () => new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new Uint8Array(MAX_NATIVE_CONTENT_BYTES + 1)); }, cancel() { cancelled = true; } }) } });
    expect((await get()).status).toBe(413);
    expect(cancelled).toBe(true);
    storage.send.mockRejectedValueOnce(new Error("test-secret private/model.usdz"));
    const response = await get();
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toMatch(/test-secret|private\//);
    expect(storage.destroy).toHaveBeenCalledTimes(2);
  });
});
