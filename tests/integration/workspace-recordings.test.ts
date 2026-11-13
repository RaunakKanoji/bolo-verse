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
vi.mock("@/server/providers/r2-recording", () => ({ writePrivateRecording: boundary.write }));
vi.mock("@/server/providers/r2-preview", () => ({
  R2PreviewReader: class {
    readObject = boundary.read;
  },
}));
import * as schema from "@/server/db/schema";
import { bootstrapPersonalWorkspace } from "@/server/db/projects";
import { BoundaryError } from "@/server/auth/errors";
import { POST } from "@/app/api/v1/workspace/recordings/route";
const pg = new PGlite(),
  db = drizzle(pg, { schema });
const owner = "record_owner",
  projectId = "d6000000-0000-4000-8000-000000000001";
const webm = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 1, 2, 3, 4]);
function request(key = randomUUID(), bytes: Uint8Array = webm, mime = "video/webm") {
  return new Request(
    `http://localhost:3000/api/v1/workspace/recordings?projectId=${projectId}&idempotencyKey=${key}`,
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
it("attaches immutable bytes idempotently and safely projects a preview URL", async () => {
  const key = randomUUID();
  const result = await POST(request(key));
  expect(result.status).toBe(201);
  const body = await result.json();
  expect(body.data.asset).toMatchObject({
    id: key,
    projectId,
    mimeType: "video/webm",
    byteSize: 8,
    width: null,
    height: null,
    durationSeconds: null,
    contentUrl: `/api/v1/assets/${key}/content`,
  });
  expect(JSON.stringify(body)).not.toMatch(/objectKey|checksum|record_owner|private\//);
  expect((await POST(request(key))).status).toBe(201);
  expect(boundary.write).toHaveBeenCalledTimes(1);
  expect((await POST(request(key, new Uint8Array([...webm, 9])))).status).toBe(409);
});
it("authorizes before consuming bytes and rejects spoofed MIME/size/origin", async () => {
  boundary.subject = "unrelated";
  const denied = request();
  Object.defineProperty(denied, "body", {
    get() {
      throw new Error("Body must not be accessed");
    },
  });
  expect((await POST(denied)).status).toBe(403);
  boundary.subject = owner;
  expect((await POST(request(randomUUID(), new Uint8Array([1, 2, 3])))).status).toBe(400);
  expect((await POST(request(randomUUID(), webm, "image/png"))).status).toBe(415);
  const oversized = request();
  oversized.headers.set("content-length", String(20 * 1024 * 1024 + 1));
  expect((await POST(oversized)).status).toBe(413);
  const badOrigin = request();
  badOrigin.headers.set("origin", "https://evil.test");
  expect((await POST(badOrigin)).status).toBe(403);
  expect(boundary.write).not.toHaveBeenCalled();
});
it("leaves failed uploads staging and retries a conditional object only after hash validation", async () => {
  const key = randomUUID();
  boundary.write.mockRejectedValueOnce(
    new BoundaryError(503, "SERVICE_UNAVAILABLE", "Storage unavailable"),
  );
  expect((await POST(request(key))).status).toBe(503);
  expect((await pg.query("SELECT status FROM assets")).rows).toEqual([{ status: "staging" }]);
  boundary.write.mockRejectedValueOnce(new BoundaryError(409, "CONFLICT", "Exists"));
  expect((await POST(request(key))).status).toBe(201);
  expect(boundary.read).toHaveBeenCalledTimes(1);
});
it("refuses promotion when permission is revoked during storage latency", async () => {
  await db
    .insert(schema.projectMembers)
    .values({ projectId, clerkUserId: "record_editor", role: "editor" });
  boundary.subject = "record_editor";
  boundary.write.mockImplementationOnce(async () => {
    await pg.query(
      "DELETE FROM project_members WHERE project_id=$1 AND clerk_user_id='record_editor'",
      [projectId],
    );
  });
  const response = await POST(request());
  expect(response.status).toBe(403);
  expect((await pg.query("SELECT status FROM assets")).rows).toEqual([{ status: "staging" }]);
});
it("never promotes an existing object with mismatched bytes", async () => {
  boundary.write.mockRejectedValueOnce(new BoundaryError(409, "CONFLICT", "Exists"));
  boundary.read.mockResolvedValueOnce({
    bytes: new Uint8Array([...webm, 9]),
    mimeType: "video/webm",
  });
  expect((await POST(request())).status).toBe(409);
  expect((await pg.query("SELECT status FROM assets")).rows).toEqual([{ status: "staging" }]);
});
it("bounds streaming bodies without Content-Length and cancels remaining bytes", async () => {
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(20 * 1024 * 1024));
      controller.enqueue(Uint8Array.of(1));
    },
    cancel() {
      cancelled = true;
    },
  });
  const raw = new Request(
    `http://localhost:3000/api/v1/workspace/recordings?projectId=${projectId}&idempotencyKey=${randomUUID()}`,
    {
      method: "POST",
      headers: { Origin: "http://localhost:3000", "Content-Type": "video/webm" },
      body: stream,
      duplex: "half",
    } as RequestInit,
  );
  expect((await POST(raw)).status).toBe(413);
  expect(cancelled).toBe(true);
  expect(boundary.write).not.toHaveBeenCalled();
});
it("does not let another project editor reuse the original actor's operation key", async () => {
  const key = randomUUID();
  expect((await POST(request(key))).status).toBe(201);
  await db
    .insert(schema.projectMembers)
    .values({ projectId, clerkUserId: "another_editor", role: "editor" });
  boundary.subject = "another_editor";
  expect((await POST(request(key))).status).toBe(409);
  expect(boundary.write).toHaveBeenCalledTimes(1);
});
