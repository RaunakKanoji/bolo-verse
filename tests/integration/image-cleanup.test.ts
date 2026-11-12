import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/server/db/client", () => ({ withDatabase: <T>(operation: (db: typeof database) => Promise<T>) => operation(database) }));
const storage = vi.hoisted(() => ({ remove: vi.fn() }));
vi.mock("@/server/providers/r2-image-cleanup", async (original) => ({ ...await original<typeof import("@/server/providers/r2-image-cleanup")>(), deleteAbandonedImageObject: storage.remove }));
import * as schema from "@/server/db/schema";
import { bootstrapPersonalWorkspace } from "@/server/db/projects";
import { createAssetUploadSession } from "@/server/db/asset-ingestions";
import { createImageGeneration } from "@/server/db/image-generations";
import { listImageCleanupCandidates, imageCleanupCandidateEligible, prepareImageCleanupCandidate } from "@/server/db/image-cleanup";
import { runImageCleanupBatch } from "@/server/services/image-cleanup";
import { isImageCleanupObjectKey } from "@/server/providers/r2-image-cleanup";
const postgres = new PGlite(), database = drizzle(postgres, { schema });
const projectId = "c1000000-0000-4000-8000-000000000001", owner = "cleanup_owner";
async function upload() { return createAssetUploadSession(owner, { projectId, idempotencyKey: randomUUID(), fileName: "reference.png", mimeType: "image/png", byteSize: 128, checksumSha256: "a".repeat(64) }); }
async function generation(status = "cancelled") {
  const job = await createImageGeneration(owner, { projectId, idempotencyKey: randomUUID(), prompt: "Private photograph", modelId: "gemini-2.5-flash-image", aspectRatio: "1:1", referenceAssetId: null });
  await postgres.query("UPDATE processing_jobs SET status=$1,updated_at=now()-interval '25 hours' WHERE id=$2", [status, job.id]);
  return job;
}
beforeAll(async () => {
  const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8")) as { entries: { tag: string }[] };
  for (const { tag } of journal.entries) await postgres.exec(await readFile(`drizzle/${tag}.sql`, "utf8"));
}, 30_000);
beforeEach(async () => {
  storage.remove.mockReset(); storage.remove.mockResolvedValue(undefined);
  await postgres.exec("TRUNCATE workspaces, rate_limit_buckets CASCADE");
  const workspace = await bootstrapPersonalWorkspace(database, owner);
  await database.insert(schema.projects).values({ id: projectId, workspaceId: workspace.id, name: "Images", objective: "Private", createdByClerkId: owner });
});
afterAll(async () => { await postgres.close(); });
describe("bounded abandoned image cleanup", () => {
  it("defaults to dry run and never exposes keys or deletes storage", async () => {
    const session = await upload();
    await postgres.query("UPDATE asset_upload_sessions SET created_at=now()-interval '26 hours',expires_at=now()-interval '25 hours' WHERE id=$1", [session.id]);
    await generation();
    const result = await runImageCleanupBatch();
    expect(result).toMatchObject({ candidates: 3, deleted: 0, failed: 0, uploads: 2, generations: 1 });
    expect(JSON.stringify(result)).not.toMatch(/staging|private|objectKey|c1000000/);
    expect(storage.remove).not.toHaveBeenCalled();
  });
  it("deletes only expired staging copies and terminal unreferenced generated objects", async () => {
    const session = await upload();
    await postgres.query("UPDATE assets SET status='ready',width=8,height=8 WHERE id=$1", [session.assetId]);
    await postgres.query("UPDATE asset_upload_sessions SET status='ready',finalized_at=now()-interval '25 hours',created_at=now()-interval '26 hours',expires_at=now()-interval '25 hours' WHERE id=$1", [session.id]);
    const job = await generation("failed");
    await generation("processing");
    await generation("ready");
    expect(await runImageCleanupBatch({ apply: true })).toMatchObject({ candidates: 2, deleted: 2, failed: 0 });
    expect(storage.remove.mock.calls.map(([key]) => key).sort()).toEqual([session.stagingObjectKey, `private/generated/${projectId}/${job.id}`].sort());
    expect(storage.remove.mock.calls.map(([key]) => key)).not.toContain(session.finalObjectKey);
    // Repeated runs are safe, and successful work is cooled down rather than starving later candidates.
    expect(await runImageCleanupBatch({ apply: true })).toMatchObject({ candidates: 0, deleted: 0 });
  });
  it("never deletes an object referenced by any asset or a recent/leased job", async () => {
    const job = await generation();
    await database.insert(schema.assets).values({ projectId, ownerClerkId: owner, objectKey: `private/generated/${projectId}/${job.id}`, mimeType: "image/png", byteSize: 128, status: "ready" });
    const recent = await generation();
    await postgres.query("UPDATE processing_jobs SET updated_at=now() WHERE id=$1", [recent.id]);
    const leased = await generation();
    await postgres.query("UPDATE processing_jobs SET lease_expires_at=now()+interval '5 minutes' WHERE id=$1", [leased.id]);
    await upload();
    expect(await listImageCleanupCandidates()).toEqual([]);
    expect((await runImageCleanupBatch({ apply: true })).deleted).toBe(0);
  });
  it("revalidates eligibility immediately before deletion", async () => {
    const first = await generation(), second = await generation();
    storage.remove.mockImplementationOnce(async () => {
      await database.insert(schema.assets).values({ projectId, ownerClerkId: owner, objectKey: `private/generated/${projectId}/${second.id}`, mimeType: "image/png", byteSize: 128, status: "ready" });
    });
    const result = await runImageCleanupBatch({ apply: true });
    expect(result).toMatchObject({ candidates: 2, deleted: 1, skipped: 1 });
    expect(storage.remove).toHaveBeenCalledWith(`private/generated/${projectId}/${first.id}`, undefined);
  });
  it("rejects unsafe keys and mismatched candidate identities", async () => {
    const session = await upload();
    await postgres.query("UPDATE asset_upload_sessions SET staging_object_key='private/important',created_at=now()-interval '26 hours',expires_at=now()-interval '25 hours' WHERE id=$1", [session.id]);
    expect((await listImageCleanupCandidates()).every((candidate) => candidate.kind !== "upload-staging")).toBe(true);
    for (const key of ["private/important", `staging/images/${projectId}/../secret`, `private/generated/${projectId}/${randomUUID()}?secret=1`, `https://storage.test/${projectId}`]) expect(isImageCleanupObjectKey(key)).toBe(false);
    const job = await generation();
    const candidate = (await listImageCleanupCandidates()).find((entry) => entry.kind === "generated")!;
    expect(await imageCleanupCandidateEligible({ ...candidate, objectKey: `private/generated/${projectId}/${randomUUID()}` })).toBe(false);
    expect(await imageCleanupCandidateEligible({ ...candidate, id: job.id, objectKey: `private/generated/${projectId}/${job.id}` })).toBe(true);
  });
  it("retires expired unpublished upload finals before deleting and records progress", async () => {
    const session = await upload();
    await postgres.query("UPDATE asset_upload_sessions SET created_at=now()-interval '26 hours',expires_at=now()-interval '25 hours' WHERE id=$1", [session.id]);
    storage.remove.mockImplementation(async (key: string) => {
      if (key !== session.finalObjectKey) return;
      expect((await postgres.query<{ status: string }>("SELECT status FROM assets WHERE id=$1", [session.assetId])).rows).toEqual([{ status: "failed" }]);
      expect((await postgres.query<{ status: string }>("SELECT status FROM asset_upload_sessions WHERE id=$1", [session.id])).rows).toEqual([{ status: "failed" }]);
    });
    expect(await runImageCleanupBatch({ apply: true })).toMatchObject({ candidates: 2, deleted: 2 });
    expect(storage.remove.mock.calls.map(([key]) => key)).toContain(session.finalObjectKey);
    expect(await runImageCleanupBatch({ apply: true })).toMatchObject({ candidates: 0, deleted: 0 });
    expect((await postgres.query<{ deleted: boolean }>("SELECT final_deleted_at IS NOT NULL AS deleted FROM asset_upload_sessions WHERE id=$1", [session.id])).rows).toEqual([{ deleted: true }]);
  });
  it("protects ready, young, active and mismatched upload final assets", async () => {
    const ready = await upload();
    await postgres.query("UPDATE assets SET status='ready',width=8,height=8 WHERE id=$1", [ready.assetId]);
    await postgres.query("UPDATE asset_upload_sessions SET created_at=now()-interval '26 hours',expires_at=now()-interval '25 hours' WHERE id=$1", [ready.id]);
    const young = await upload();
    await postgres.query("UPDATE asset_upload_sessions SET expires_at=now()-interval '1 hour' WHERE id=$1", [young.id]);
    const active = await upload();
    await postgres.query("UPDATE asset_upload_sessions SET created_at=now()-interval '26 hours',expires_at=now()+interval '1 minute' WHERE id=$1", [active.id]);
    const mismatched = await upload();
    await postgres.query("UPDATE asset_upload_sessions SET created_at=now()-interval '26 hours',expires_at=now()-interval '25 hours',final_object_key=$1 WHERE id=$2", [`private/images/${projectId}/${randomUUID()}`, mismatched.id]);
    expect((await listImageCleanupCandidates()).filter((candidate) => candidate.kind === "upload-final")).toEqual([]);
    expect(await prepareImageCleanupCandidate({ kind: "upload-final", id: ready.id, objectKey: ready.finalObjectKey })).toBe(false);
    expect((await postgres.query<{ status: string }>("SELECT status FROM assets WHERE id=$1", [ready.assetId])).rows).toEqual([{ status: "ready" }]);
  });
  it("retries a crash after final retirement without publishing or starving progress", async () => {
    const session = await upload();
    await postgres.query("UPDATE asset_upload_sessions SET created_at=now()-interval '26 hours',expires_at=now()-interval '25 hours',staging_deleted_at=now() WHERE id=$1", [session.id]);
    const [candidate] = await listImageCleanupCandidates();
    expect(candidate.kind).toBe("upload-final");
    expect(await prepareImageCleanupCandidate(candidate)).toBe(true);
    storage.remove.mockRejectedValueOnce(new Error("Storage interrupted"));
    expect(await runImageCleanupBatch({ apply: true })).toMatchObject({ candidates: 1, failed: 1, deleted: 0 });
    expect(await runImageCleanupBatch({ apply: true })).toMatchObject({ candidates: 1, failed: 0, deleted: 1 });
    expect(await listImageCleanupCandidates()).toEqual([]);
  });
  it("bounds batches and isolates failures without leaking storage exceptions", async () => {
    await generation();
    storage.remove.mockRejectedValue(new Error("https://secret-bearing-storage-link"));
    expect(await runImageCleanupBatch({ apply: true, limit: 1 })).toMatchObject({ candidates: 1, deleted: 0, failed: 1 });
    await expect(runImageCleanupBatch({ limit: 21 })).rejects.toThrow(/between 1 and 20/);
    await expect(listImageCleanupCandidates(0)).rejects.toThrow(/between 1 and 20/);
  });
});
