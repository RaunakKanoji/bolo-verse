import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { nativeTestPublicKey, nativeTestPublishableKey, sessionJWT } from "../helpers/native-session";
vi.mock("server-only", () => ({}));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: null }) }));
const storage = vi.hoisted(() => ({ send: vi.fn(), destroy: vi.fn() }));
vi.mock("@aws-sdk/client-s3", async (importOriginal) => {
  const original = await importOriginal<typeof import("@aws-sdk/client-s3")>();
  return { ...original, S3Client: class extends original.S3Client { send = storage.send; destroy = storage.destroy; } };
});
vi.mock("@/server/db/client", () => ({ withDatabase: <T>(operation: (db: typeof database) => Promise<T>) => operation(database) }));
import * as schema from "@/server/db/schema";
import { bootstrapPersonalWorkspace } from "@/server/db/projects";
import { POST as RESERVE } from "@/app/api/v1/assets/upload-session/route";
import { POST as FINALIZE } from "@/app/api/v1/assets/upload-session/[uploadId]/finalize/route";
const postgres = new PGlite(), database = drizzle(postgres, { schema });
const projectId = "a1000000-0000-4000-8000-000000000001", otherProjectId = "a1000000-0000-4000-8000-000000000002";
const owner = "image_owner", editor = "image_editor", client = "image_client", outsider = "image_outsider";
const bytes = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVQImWMwMjL6DwACxgGWgWwZRAAAAABJRU5ErkJggg==", "base64"));
const checksumSha256 = createHash("sha256").update(bytes).digest("hex");
const input = { projectId, fileName: "source.png", mimeType: "image/png", byteSize: bytes.length, checksumSha256 };
const objects = new Map<string, { bytes: Uint8Array; mimeType: string }>();
function request(path: string, body: unknown, subject = owner) {
  return new Request(`http://localhost:3000/api/v1/assets/${path}`, { method: "POST", headers: { Authorization: `Bearer ${sessionJWT(subject)}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
async function reserve(subject = owner, override: Record<string, unknown> = {}) { return RESERVE(request("upload-session", { ...input, idempotencyKey: randomUUID(), ...override }, subject)); }
const finalize = (uploadId: string, subject = owner, body: unknown = {}) => FINALIZE(request(`upload-session/${uploadId}/finalize`, body, subject), { params: Promise.resolve({ uploadId }) });
function storedObject(value: { bytes: Uint8Array; mimeType: string }) {
  return { ContentLength: value.bytes.length, ContentType: value.mimeType, Body: { transformToWebStream: () => new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(value.bytes); controller.close(); } }) } };
}
async function staged(subject = owner, override: Record<string, unknown> = {}) {
  const response = await reserve(subject, override);
  expect(response.status).toBe(201);
  const { data: { upload } } = await response.json();
  const key = decodeURIComponent(new URL(upload.uploadUrl).pathname).replace("/private-assets/", "");
  objects.set(key, { bytes, mimeType: "image/png" });
  return { ...upload, uploadId: upload.id, key } as { uploadId: string; key: string; uploadUrl: string; headers: Record<string, string> };
}
beforeAll(async () => {
  const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8")) as { entries: { tag: string }[] };
  for (const { tag } of journal.entries) await postgres.exec(await readFile(`drizzle/${tag}.sql`, "utf8"));
}, 30_000);
beforeEach(async () => {
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_configured"); vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", nativeTestPublishableKey); vi.stubEnv("CLERK_JWT_KEY", nativeTestPublicKey); vi.stubEnv("DATABASE_URL", "postgres://test");
  vi.stubEnv("R2_ACCOUNT_ID", "a".repeat(32)); vi.stubEnv("R2_ACCESS_KEY_ID", "test-id"); vi.stubEnv("R2_SECRET_ACCESS_KEY", "test-secret"); vi.stubEnv("R2_BUCKET", "private-assets");
  objects.clear(); storage.destroy.mockReset();
  storage.send.mockReset().mockImplementation(async (command) => {
    const key = command.input.Key as string;
    if (command.constructor.name === "PutObjectCommand") {
      if (objects.has(key)) throw { name: "PreconditionFailed", $metadata: { httpStatusCode: 412 } };
      objects.set(key, { bytes: new Uint8Array(command.input.Body), mimeType: command.input.ContentType }); return {};
    }
    const object = objects.get(key); if (!object) throw new Error("NoSuchKey");
    return storedObject(object);
  });
  await postgres.exec("TRUNCATE workspaces CASCADE");
  const workspace = await bootstrapPersonalWorkspace(database, owner), other = await bootstrapPersonalWorkspace(database, outsider);
  await database.insert(schema.projects).values([{ id: projectId, workspaceId: workspace.id, name: "Images", objective: "Private ingestion", createdByClerkId: owner }, { id: otherProjectId, workspaceId: other.id, name: "Foreign", objective: "Unrelated", createdByClerkId: outsider }]);
  await database.insert(schema.projectMembers).values([{ projectId, clerkUserId: editor, role: "editor" }, { projectId, clerkUserId: client, role: "client" }]);
});
afterAll(async () => { vi.unstubAllEnvs(); await postgres.close(); });
describe("private image ingestion", () => {
  it("publishes validated bytes under an immutable server key and returns the same asset on retry", async () => {
    const upload = await staged();
    const first = await finalize(upload.uploadId); expect(first.status).toBe(200);
    const result = await first.json();
    expect(result.data.asset).toMatchObject({ projectId, mimeType: "image/png", byteSize: bytes.length, width: 1, height: 1 });
    expect(JSON.stringify(result)).not.toMatch(/objectKey|checksum|test-secret|staging\//);
    const rows = await database.select().from(schema.assets);
    expect(rows).toHaveLength(1); expect(rows[0]).toMatchObject({ id: result.data.asset.id, status: "ready", checksumSha256 });
    expect(rows[0].objectKey).not.toBe(upload.key); expect(objects.get(rows[0].objectKey)?.bytes).toEqual(bytes);
    const writes = storage.send.mock.calls.filter(([command]) => command.constructor.name === "PutObjectCommand");
    expect(writes).toHaveLength(1); expect(writes[0][0].input.IfNoneMatch).toBe("*");
    const retry = await finalize(upload.uploadId); expect(retry.status).toBe(200);
    expect((await retry.json()).data.asset.id).toBe(result.data.asset.id);
    expect(await database.select().from(schema.assets)).toHaveLength(1);
  });
  it.each([
    ["image/jpeg", "/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAADAAIDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAABgf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCYAqoa/9k="],
    ["image/webp", "UklGRjoAAABXRUJQVlA4IC4AAADQAQCdASoCAAMAAUAmJaACdLoB+AADsAD+5fo/+2h/Wh/Wh/2sf/mwNUWb5aAA"],
  ])("publishes genuine static %s bytes with validated dimensions", async (mimeType, encoded) => {
    const image = Uint8Array.from(Buffer.from(encoded, "base64"));
    const upload = await staged(owner, { mimeType, byteSize: image.length, checksumSha256: createHash("sha256").update(image).digest("hex") });
    objects.set(upload.key, { bytes: image, mimeType });
    const response = await finalize(upload.uploadId); expect(response.status).toBe(200);
    expect((await response.json()).data.asset).toMatchObject({ mimeType, byteSize: image.length, width: 2, height: 3 });
  });
  it("denies foreign projects, read-only clients and untrusted reservation fields", async () => {
    expect((await reserve(outsider)).status).toBe(403); expect((await reserve(client)).status).toBe(403);
    expect((await reserve(owner, { projectId: otherProjectId })).status).toBe(403);
    for (const override of [{ objectKey: "attacker/key" }, { uploadUrl: "https://attacker.example" }, { mimeType: "image/svg+xml" }, { byteSize: 0 }, { checksumSha256: "invalid" }]) expect((await reserve(owner, override)).status).toBe(400);
    expect(storage.send).not.toHaveBeenCalled();
  });
  it("rejects untrusted browser origins, missing identities and malformed upload IDs", async () => {
    const hostile = request("upload-session", { ...input, idempotencyKey: randomUUID() });
    hostile.headers.set("Origin", "https://attacker.example");
    expect((await RESERVE(hostile)).status).toBe(403);
    const anonymous = request("upload-session", { ...input, idempotencyKey: randomUUID() }); anonymous.headers.delete("Authorization");
    expect((await RESERVE(anonymous)).status).toBe(401);
    expect((await finalize("malformed")).status).toBe(400);
    expect((await finalize(randomUUID())).status).toBe(403);
    expect(storage.send).not.toHaveBeenCalled();
    expect(await database.select().from(schema.assets)).toHaveLength(0);
  });
  it("binds sessions to the initiating actor and validates finalize body and identity", async () => {
    const upload = await staged(editor);
    expect((await finalize(upload.uploadId, owner)).status).toBe(403);
    expect((await finalize(upload.uploadId, client)).status).toBe(403);
    expect((await finalize(upload.uploadId, editor, { objectKey: "attacker/key" })).status).toBe(400);
    const forged = request("upload-session", { ...input, idempotencyKey: randomUUID() }); forged.headers.set("Authorization", "Bearer forged");
    expect((await RESERVE(forged)).status).toBe(401); expect(storage.send).not.toHaveBeenCalled();
  });
  it.each(["size", "checksum", "mime", "structure", "dimensions", "pixel data"])("rejects an invalid staged %s before creating a ready asset", async (kind) => {
    const upload = await staged(); let changed = bytes.slice(), mimeType = "image/png";
    if (kind === "size") changed = changed.slice(0, -1);
    if (kind === "checksum") changed[45] ^= 1;
    if (kind === "mime") mimeType = "text/html";
    if (kind === "structure") changed = new TextEncoder().encode("<svg/>");
    if (kind === "pixel data") changed = Uint8Array.from([...bytes.slice(0, 33), ...bytes.slice(-12)]);
    if (kind === "dimensions") { new DataView(changed.buffer).setUint32(16, 100000); }
    if (kind === "structure" || kind === "dimensions" || kind === "pixel data") {
      // Adjust the reservation to test image structure independently of checksum rejection.
      const second = await staged(owner, { byteSize: changed.length, checksumSha256: createHash("sha256").update(changed).digest("hex") });
      objects.set(second.key, { bytes: changed, mimeType });
      expect((await finalize(second.uploadId)).status).toBe(400);
    } else { objects.set(upload.key, { bytes: changed, mimeType }); expect((await finalize(upload.uploadId)).status).toBe(400); }
    expect((await database.select().from(schema.assets)).filter((asset) => asset.status === "ready")).toHaveLength(0);
    expect(storage.send.mock.calls.filter(([command]) => command.constructor.name === "PutObjectCommand")).toHaveLength(0);
  });
  it("rechecks membership after a staged read and never publishes revoked bytes", async () => {
    const upload = await staged(editor);
    let release!: (value: ReturnType<typeof storedObject>) => void, started!: () => void;
    const pending = new Promise<ReturnType<typeof storedObject>>((resolve) => { release = resolve; });
    const begun = new Promise<void>((resolve) => { started = resolve; });
    storage.send.mockImplementationOnce(() => { started(); return pending; });
    const response = finalize(upload.uploadId, editor); await begun;
    await postgres.query("DELETE FROM project_members WHERE clerk_user_id=$1", [editor]);
    release(storedObject({ bytes, mimeType: "image/png" }));
    expect((await response).status).toBe(403); expect((await database.select().from(schema.assets)).filter((asset) => asset.status === "ready")).toHaveLength(0);
    expect(storage.send.mock.calls.filter(([command]) => command.constructor.name === "PutObjectCommand")).toHaveLength(0);
  });
  it("reuses one reservation for an idempotency key and rejects changed request contents", async () => {
    const idempotencyKey = randomUUID();
    const first = await reserve(owner, { idempotencyKey }); expect(first.status).toBe(201);
    const second = await reserve(owner, { idempotencyKey }); expect(second.status).toBe(201);
    const a = (await first.json()).data.upload, b = (await second.json()).data.upload;
    expect(a.id).toBe(b.id); expect(a.assetId).toBe(b.assetId);
    expect(await database.select().from(schema.assets)).toHaveLength(1);
    expect((await reserve(owner, { idempotencyKey, fileName: "changed.png" })).status).toBe(409);
  });
  it("rejects an expired upload without reading private objects", async () => {
    const upload = await staged();
    await postgres.query("UPDATE asset_upload_sessions SET expires_at=now()-interval '1 second' WHERE id=$1", [upload.uploadId]);
    expect((await finalize(upload.uploadId)).status).toBe(409);
    expect(storage.send).not.toHaveBeenCalled();
    expect((await database.select().from(schema.assets)).filter((asset) => asset.status === "ready")).toHaveLength(0);
  });
  it("does not publish metadata when access is revoked while writing final bytes", async () => {
    const upload = await staged(editor);
    const implementation = storage.send.getMockImplementation()!;
    let release!: () => void, started!: () => void;
    const pending = new Promise<void>((resolve) => { release = resolve; });
    const begun = new Promise<void>((resolve) => { started = resolve; });
    storage.send.mockImplementation(async (command, options) => {
      if (command.constructor.name === "PutObjectCommand") { started(); await pending; }
      return implementation(command, options);
    });
    const result = finalize(upload.uploadId, editor); await begun;
    await postgres.query("DELETE FROM project_members WHERE clerk_user_id=$1", [editor]); release();
    expect((await result).status).toBe(403);
    expect((await database.select().from(schema.assets)).filter((asset) => asset.status === "ready")).toHaveLength(0);
  });
  it("recovers a retry after final bytes were written but metadata publication failed", async () => {
    const upload = await staged();
    const [asset] = await database.select().from(schema.assets);
    objects.set(asset.objectKey, { bytes, mimeType: "image/png" });
    const response = await finalize(upload.uploadId); expect(response.status).toBe(200);
    expect((await response.json()).data.asset.id).toBe(asset.id);
    expect((await database.select().from(schema.assets)).filter((value) => value.status === "ready")).toHaveLength(1);
    // A conflict must never degrade into an unconditional replacement write.
    const writes = storage.send.mock.calls.filter(([command]) => command.constructor.name === "PutObjectCommand");
    expect(writes).toHaveLength(1); expect(writes[0][0].input.IfNoneMatch).toBe("*");
  });
  it("refuses existing final bytes that differ from the reservation", async () => {
    const upload = await staged(); const [asset] = await database.select().from(schema.assets);
    const changed = bytes.slice(); changed[45] ^= 1;
    objects.set(asset.objectKey, { bytes: changed, mimeType: "image/png" });
    expect((await finalize(upload.uploadId)).status).toBe(400);
    expect((await database.select().from(schema.assets)).filter((value) => value.status === "ready")).toHaveLength(0);
    expect(objects.get(asset.objectKey)?.bytes).toEqual(changed);
  });
  it("sanitizes storage failures and keeps incomplete objects out of the asset registry", async () => {
    const upload = await staged(); storage.send.mockRejectedValueOnce(new Error("test-secret staging/private-key"));
    const response = await finalize(upload.uploadId); expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toMatch(/test-secret|private-key/);
    expect((await database.select().from(schema.assets)).filter((asset) => asset.status === "ready")).toHaveLength(0);
  });
});
