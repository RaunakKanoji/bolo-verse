import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { beforeAll, beforeEach, afterAll, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
const boundary = vi.hoisted(() => ({
  subject: "record_owner" as string | null,
  write: vi.fn(),
  read: vi.fn(),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: boundary.subject }) }));
vi.mock("@/server/db/client", () => ({
  withDatabase: <T>(fn: (database: typeof db) => Promise<T>) => fn(db),
}));
vi.mock("@/server/providers/r2-recording", () => ({ writePrivateLibraryAsset: boundary.write }));
vi.mock("@/server/providers/r2-preview", () => ({
  R2PreviewReader: class {
    readObject = boundary.read;
  },
}));
import * as schema from "@/server/db/schema";
import { bootstrapPersonalWorkspace } from "@/server/db/projects";
import { BoundaryError } from "@/server/auth/errors";
import { GET as CONTENT } from "@/app/api/v1/assets/[assetId]/content/route";
import { GET as DOWNLOAD } from "@/app/api/v1/workspace/assets/[assetId]/download/route";
import { GET as LIBRARY } from "@/app/api/v1/workspace/assets/route";
import { POST } from "@/app/api/v1/workspace/uploads/route";
const pg = new PGlite(),
  db = drizzle(pg, { schema });
const owner = "record_owner",
  projectId = "d6000000-0000-4000-8000-000000000001";
const webm = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 1, 2, 3, 4]);
function request(key = randomUUID(), bytes: Uint8Array = webm, mime = "video/webm") {
  return new Request(
    `http://localhost:3000/api/v1/workspace/uploads?projectId=${projectId}&idempotencyKey=${key}`,
    {
      method: "POST",
      headers: { Origin: "http://localhost:3000", "Content-Type": mime },
      body: bytes as BodyInit,
    },
  );
}
beforeAll(async () => {
  const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8"));
  for (const { tag } of journal.entries)
    await pg.exec(await readFile(`drizzle/${tag}.sql`, "utf8"));
}, 30000);
beforeEach(async () => {
  boundary.subject = owner;
  boundary.write.mockReset().mockResolvedValue(undefined);
  boundary.read.mockReset().mockResolvedValue({ bytes: webm, mimeType: "video/webm" });
  for (const [k, v] of Object.entries({
    CLERK_SECRET_KEY: "sk_test_configured",
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_configured",
    DATABASE_URL: "postgres://test",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    ALLOWED_ORIGINS: "http://localhost:3000",
  }))
    vi.stubEnv(k, v);
  await pg.exec("TRUNCATE workspaces,rate_limit_buckets CASCADE");
  const workspace = await bootstrapPersonalWorkspace(db, owner);
  await db.insert(schema.projects).values({
    id: projectId,
    workspaceId: workspace.id,
    name: "Recording",
    objective: "Capture a clip",
    createdByClerkId: owner,
  });
});
afterAll(async () => {
  await pg.close();
  vi.unstubAllEnvs();
});

function glb() {
  const json = new TextEncoder().encode(
    JSON.stringify({ asset: { version: "2.0" } }).padEnd(32, " "),
  );
  const bytes = new Uint8Array(20 + json.length);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, bytes.length, true);
  view.setUint32(12, json.length, true);
  view.setUint32(16, 0x4e4f534a, true);
  bytes.set(json, 20);
  return bytes;
}
const json = (value: unknown) => new TextEncoder().encode(JSON.stringify(value));
it.each([
  ["application/pdf", new TextEncoder().encode("%PDF-1.7\n%%EOF")],
  ["model/gltf-binary", glb()],
  ["model/gltf+json", json({ asset: { version: "2.0" } })],
  ["video/webm", webm],
  ["video/mp4", new Uint8Array([0, 0, 0, 16, 102, 116, 121, 112, 105, 115, 111, 109, 0, 0, 0, 0])],
])(
  "ingests %s privately, retries exactly, and serves validated bounded content",
  async (mime, bytes) => {
    const key = randomUUID();
    const result = await POST(request(key, bytes, mime));
    expect(result.status).toBe(201);
    const body = await result.json();
    expect(body.data.asset).toMatchObject({
      id: key,
      mimeType: mime,
      byteSize: bytes.length,
      contentUrl: `/api/v1/assets/${key}/content`,
    });
    expect(JSON.stringify(body)).not.toMatch(/objectKey|private\/|checksum|record_owner/);
    expect((await POST(request(key, bytes, mime))).status).toBe(201);
    expect(boundary.write).toHaveBeenCalledTimes(1);
    expect(boundary.write.mock.calls[0][0].objectKey).toMatch(/^private\/library\//);
    boundary.read.mockResolvedValueOnce({ bytes, mimeType: mime });
    const content = await CONTENT(new Request("http://localhost:3000/api/v1/assets/content"), {
      params: Promise.resolve({ assetId: key }),
    });
    expect(content.status).toBe(200);
    expect(content.headers.get("content-type")).toBe(mime);
    expect(content.headers.get("x-content-type-options")).toBe("nosniff");
    expect(new Uint8Array(await content.arrayBuffer())).toEqual(bytes);
    if (mime === "application/pdf")
      expect(content.headers.get("content-disposition")).toContain("attachment");
    expect(
      (
        await POST(
          request(
            key,
            mime === "model/gltf-binary"
              ? new Uint8Array([...bytes.slice(0, -1), 10])
              : new Uint8Array([...bytes, 9]),
            mime,
          ),
        )
      ).status,
    ).toBe(409);
  },
);
it("rejects external glTF, MIME spoofs, audio and images without storing rows or bytes", async () => {
  for (const [mime, bytes] of [
    [
      "model/gltf+json",
      json({ asset: { version: "2.0" }, images: [{ uri: "https://evil.test/image.png" }] }),
    ],
    ["model/gltf-binary", new Uint8Array([1, 2, 3])],
    ["application/pdf", webm],
  ] as const)
    expect((await POST(request(randomUUID(), bytes, mime))).status).toBe(400);
  for (const mime of ["audio/ogg", "audio/webm", "image/png", "text/html"])
    expect((await POST(request(randomUUID(), webm, mime))).status).toBe(415);
  expect(boundary.write).not.toHaveBeenCalled();
  expect((await pg.query("SELECT id FROM assets")).rows).toEqual([]);
});
it("denies foreign writes before reading, applies stream bounds, and rechecks permission after storage", async () => {
  boundary.subject = "unrelated";
  const denied = request();
  Object.defineProperty(denied, "body", {
    get() {
      throw new Error("Body must not be read");
    },
  });
  expect((await POST(denied)).status).toBe(403);
  boundary.subject = owner;
  const oversized = request();
  oversized.headers.set("content-length", String(20 * 1024 * 1024 + 1));
  expect((await POST(oversized)).status).toBe(413);
  await db
    .insert(schema.projectMembers)
    .values({ projectId, clerkUserId: "upload_editor", role: "editor" });
  boundary.subject = "upload_editor";
  boundary.write.mockImplementationOnce(async () => {
    await pg.query(
      "DELETE FROM project_members WHERE project_id=$1 AND clerk_user_id='upload_editor'",
      [projectId],
    );
  });
  expect((await POST(request())).status).toBe(403);
  expect((await pg.query("SELECT status FROM assets")).rows).toEqual([{ status: "staging" }]);
});
it("revalidates an existing conditional object before completing a retry", async () => {
  boundary.write.mockRejectedValueOnce(new BoundaryError(409, "CONFLICT", "Exists"));
  boundary.read.mockResolvedValueOnce({ bytes: webm, mimeType: "video/webm" });
  expect((await POST(request())).status).toBe(201);
  boundary.write.mockRejectedValueOnce(new BoundaryError(409, "CONFLICT", "Exists"));
  boundary.read.mockResolvedValueOnce({
    bytes: new Uint8Array([...webm, 9]),
    mimeType: "video/webm",
  });
  expect((await POST(request())).status).toBe(409);
});

function wav() {
  const bytes = new Uint8Array(48),
    v = new DataView(bytes.buffer),
    ascii = (text: string, at: number) => bytes.set(new TextEncoder().encode(text), at);
  ascii("RIFF", 0);
  v.setUint32(4, 40, true);
  ascii("WAVEfmt ", 8);
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, 16000, true);
  v.setUint32(28, 32000, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  ascii("data", 36);
  v.setUint32(40, 4, true);
  return bytes;
}
it("uploads PCM WAV as a private attachment without enabling XR audio previews", async () => {
  const bytes = wav(),
    key = randomUUID();
  const upload = await POST(request(key, bytes, "audio/wav"));
  expect(upload.status).toBe(201);
  expect((await upload.json()).data.asset.contentUrl).toBeNull();
  const library = await LIBRARY(
    new Request("http://localhost:3000/api/v1/workspace/assets?category=audio"),
  );
  expect((await library.json()).data.assets[0]).toMatchObject({
    id: key,
    category: "audio",
    contentUrl: null,
    downloadUrl: `/api/v1/workspace/assets/${key}/download`,
  });
  boundary.read.mockResolvedValueOnce({ bytes, mimeType: "audio/wav" });
  const result = await DOWNLOAD(new Request("http://localhost:3000/download"), {
    params: Promise.resolve({ assetId: key }),
  });
  expect(result.status).toBe(200);
  expect(result.headers.get("content-disposition")).toContain("attachment");
  expect(result.headers.get("content-type")).toBe("audio/wav");
  expect(result.headers.get("x-content-type-options")).toBe("nosniff");
  expect(new Uint8Array(await result.arrayBuffer())).toEqual(bytes);
  boundary.subject = "unrelated";
  expect(
    (
      await DOWNLOAD(new Request("http://localhost:3000/download"), {
        params: Promise.resolve({ assetId: key }),
      })
    ).status,
  ).toBe(403);
});
it("checks attachment hashes and reauthorizes after private storage latency", async () => {
  const bytes = wav(),
    key = randomUUID();
  expect((await POST(request(key, bytes, "audio/wav"))).status).toBe(201);
  const context = { params: Promise.resolve({ assetId: key }) };
  boundary.read.mockResolvedValueOnce({
    bytes: new Uint8Array([...bytes, 9]),
    mimeType: "audio/wav",
  });
  expect((await DOWNLOAD(new Request("http://localhost:3000/download"), context)).status).toBe(503);
  await db
    .insert(schema.projectMembers)
    .values({ projectId, clerkUserId: "download_editor", role: "editor" });
  boundary.subject = "download_editor";
  boundary.read.mockImplementationOnce(async () => {
    await pg.query(
      "DELETE FROM project_members WHERE project_id=$1 AND clerk_user_id='download_editor'",
      [projectId],
    );
    return { bytes, mimeType: "audio/wav" };
  });
  expect((await DOWNLOAD(new Request("http://localhost:3000/download"), context)).status).toBe(403);
});
