import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/server/db/client", () => ({ withDatabase: <T>(operation: (db: typeof database) => Promise<T>) => operation(database) }));
import * as schema from "@/server/db/schema";
import { bootstrapPersonalWorkspace } from "@/server/db/projects";
import { createImageGeneration, listImageGenerations, readImageGeneration, cancelImageGeneration, claimImageGeneration, markImageProviderStarted, readClaimedImageGeneration, completeImageGeneration, failImageGeneration, recoverExpiredImageGenerations } from "@/server/db/image-generations";
const postgres = new PGlite();
const database = drizzle(postgres, { schema });
const projectId = "a1000000-0000-4000-8000-000000000001";
const referenceId = "a2000000-0000-4000-8000-000000000001";
const owner = "generation_owner", editor = "generation_editor", client = "generation_client";
const input = () => ({ projectId, idempotencyKey: randomUUID(), prompt: "A calm product photograph", modelId: "gemini-2.5-flash-image" as const, aspectRatio: "1:1" as const, referenceAssetId: null as string | null });
const output = () => ({ objectKey: `private/generated/${randomUUID()}.png`, mimeType: "image/png" as const, byteSize: 128, width: 8, height: 8, checksumSha256: "a".repeat(64) });
beforeAll(async () => {
  const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8")) as { entries: { tag: string }[] };
  for (const { tag } of journal.entries) await postgres.exec(await readFile(`drizzle/${tag}.sql`, "utf8"));
}, 30_000);
beforeEach(async () => {
  await postgres.exec("TRUNCATE workspaces, rate_limit_buckets CASCADE");
  const workspace = await bootstrapPersonalWorkspace(database, owner);
  await database.insert(schema.projects).values({ id: projectId, workspaceId: workspace.id, name: "Creation", objective: "Private images", createdByClerkId: owner });
  await database.insert(schema.projectMembers).values([{ projectId, clerkUserId: editor, role: "editor" }, { projectId, clerkUserId: client, role: "client" }]);
  await database.insert(schema.assets).values({ id: referenceId, projectId, ownerClerkId: owner, objectKey: "private/reference.png", mimeType: "image/png", byteSize: 128, status: "ready" });
});
afterAll(async () => { await postgres.close(); });

describe("durable private image generation", () => {
  it("creates a private idempotent request and hides transport secrets", async () => {
    const request = input();
    const job = await createImageGeneration(owner, request);
    expect(await createImageGeneration(owner, request)).toEqual(job);
    expect(job).toMatchObject({ status: "queued", prompt: request.prompt, outputAssetId: null });
    expect(JSON.stringify(job)).not.toMatch(/objectKey|ownerClerkId|requestHash|idempotencyKey/);
    expect(await listImageGenerations(owner, projectId)).toEqual([job]);
    await expect(readImageGeneration(editor, job.id)).rejects.toMatchObject({ status: 403 });
    await expect(readImageGeneration("outsider", job.id)).rejects.toMatchObject({ status: 403 });
    await expect(createImageGeneration(owner, { ...request, prompt: "Different" })).rejects.toMatchObject({ status: 409 });
  });
  it("rejects readers, revoked editors and invalid private references", async () => {
    await expect(createImageGeneration(client, input())).rejects.toMatchObject({ status: 403 });
    expect((await createImageGeneration(editor, { ...input(), referenceAssetId: referenceId })).status).toBe("queued");
    await expect(createImageGeneration(owner, { ...input(), referenceAssetId: randomUUID() })).rejects.toMatchObject({ status: 400 });
    const stagingId = randomUUID();
    await database.insert(schema.assets).values({ id: stagingId, projectId, ownerClerkId: owner, objectKey: "private/staging.png", mimeType: "image/png", byteSize: 128, status: "staging" });
    await expect(createImageGeneration(owner, { ...input(), referenceAssetId: stagingId })).rejects.toMatchObject({ status: 400 });
    for (const [mimeType, byteSize] of [["image/png", 10 * 1024 * 1024 + 1], ["video/mp4", 128]] as const) {
      const id = randomUUID();
      await database.insert(schema.assets).values({ id, projectId, ownerClerkId: owner, objectKey: `private/${id}`, mimeType, byteSize, status: "ready" });
      await expect(createImageGeneration(owner, { ...input(), referenceAssetId: id })).rejects.toMatchObject({ status: 400 });
    }
    await postgres.query("DELETE FROM project_members WHERE clerk_user_id=$1", [editor]);
    await expect(createImageGeneration(editor, input())).rejects.toMatchObject({ status: 403 });
  });
  it("serializes duplicate submissions and permits independent actor keys", async () => {
    const request = input();
    const jobs = await Promise.all([createImageGeneration(owner, request), createImageGeneration(owner, request)]);
    expect(jobs[0].id).toBe(jobs[1].id);
    expect((await postgres.query<{ count: number }>("SELECT count FROM rate_limit_buckets")).rows).toEqual([{ count: 1 }]);
    const editorJob = await createImageGeneration(editor, { ...request, prompt: "Independent" });
    expect(editorJob.id).not.toBe(jobs[0].id);
    expect(await listImageGenerations(editor, projectId)).toEqual([editorJob]);
    await expect(listImageGenerations("outsider", projectId)).rejects.toMatchObject({ status: 403 });
  });
  it("enforces an actor quota without charging repeated idempotent submissions", async () => {
    const request = input();
    for (let n = 0; n < 10; n++) await createImageGeneration(owner, n ? input() : request);
    expect((await createImageGeneration(owner, request)).status).toBe("queued");
    await expect(createImageGeneration(owner, input())).rejects.toMatchObject({ status: 429 });
    expect((await createImageGeneration(editor, input())).status).toBe("queued");
  });
  it("claims once, marks provider once and atomically persists an immutable private output", async () => {
    const job = await createImageGeneration(owner, { ...input(), referenceAssetId: referenceId });
    const claim = await claimImageGeneration(job.id);
    expect(claim?.reference?.id).toBe(referenceId);
    expect(claim?.job.attempts).toBe(1);
    const lease = claim!.job.leaseExpiresAt!;
    expect(await claimImageGeneration(job.id)).toBeNull();
    expect(await markImageProviderStarted(job.id, lease)).toBe(true);
    expect(await markImageProviderStarted(job.id, lease)).toBe(false);
    expect(await readClaimedImageGeneration(job.id, lease)).not.toBeNull();
    const ready = await completeImageGeneration(job.id, lease, output());
    expect(ready?.status).toBe("ready");
    const stored = await postgres.query<{ owner_clerk_id: string; status: string }>("SELECT owner_clerk_id,status FROM assets WHERE id=$1", [ready!.outputAssetId]);
    expect(stored.rows).toEqual([{ owner_clerk_id: owner, status: "ready" }]);
    expect(await completeImageGeneration(job.id, lease, output())).toBeNull();
    await expect(postgres.query("UPDATE assets SET byte_size=1 WHERE id=$1", [ready!.outputAssetId])).rejects.toThrow(/immutable/);
  });
  it("cancellation prevents late outputs and retains terminal states", async () => {
    const job = await createImageGeneration(owner, input());
    const claim = await claimImageGeneration(job.id);
    await expect(cancelImageGeneration(editor, job.id)).rejects.toMatchObject({ status: 403 });
    expect((await cancelImageGeneration(owner, job.id)).status).toBe("cancelled");
    expect((await cancelImageGeneration(owner, job.id)).status).toBe("cancelled");
    expect(await readClaimedImageGeneration(job.id, claim!.job.leaseExpiresAt!)).toBeNull();
    expect(await completeImageGeneration(job.id, claim!.job.leaseExpiresAt!, output())).toBeNull();
    expect((await postgres.query("SELECT * FROM assets WHERE id<>$1", [referenceId])).rows).toHaveLength(0);
  });
  it("revocation blocks queued claims and all processing checkpoints but permits safe failure", async () => {
    const queued = await createImageGeneration(editor, input());
    const active = await createImageGeneration(editor, input());
    const claim = await claimImageGeneration(active.id);
    await postgres.query("DELETE FROM project_members WHERE clerk_user_id=$1", [editor]);
    expect(await claimImageGeneration(queued.id)).toBeNull();
    expect(await markImageProviderStarted(active.id, claim!.job.leaseExpiresAt!)).toBe(false);
    expect(await readClaimedImageGeneration(active.id, claim!.job.leaseExpiresAt!)).toBeNull();
    expect(await completeImageGeneration(active.id, claim!.job.leaseExpiresAt!, output())).toBeNull();
    expect(await failImageGeneration(active.id, claim!.job.leaseExpiresAt!, "ACCESS_REVOKED", "Access is no longer available.")).toBe(true);
    await expect(readImageGeneration(editor, active.id)).rejects.toMatchObject({ status: 403 });
  });
  it("never retries possibly billed expired work and rejects stale leases", async () => {
    const job = await createImageGeneration(owner, input());
    const claim = await claimImageGeneration(job.id);
    expect(await readClaimedImageGeneration(job.id, new Date(0))).toBeNull();
    expect(await completeImageGeneration(job.id, new Date(0), output())).toBeNull();
    await postgres.query("UPDATE processing_jobs SET lease_expires_at=now()-interval '1 second' WHERE id=$1", [job.id]);
    expect(await readClaimedImageGeneration(job.id, claim!.job.leaseExpiresAt!)).toBeNull();
    expect(await recoverExpiredImageGenerations()).toBe(1);
    expect((await readImageGeneration(owner, job.id))).toMatchObject({ status: "failed", errorCode: "INTERRUPTED" });
    expect(await claimImageGeneration(job.id)).toBeNull();
  });
  it("cannot cancel after downgrade and cannot overwrite a finished failure", async () => {
    const job = await createImageGeneration(editor, input());
    const claim = await claimImageGeneration(job.id);
    const lease = claim!.job.leaseExpiresAt!;
    await postgres.query("UPDATE project_members SET role='client' WHERE clerk_user_id=$1", [editor]);
    await expect(cancelImageGeneration(editor, job.id)).rejects.toMatchObject({ status: 403 });
    expect(await failImageGeneration(job.id, lease, "SERVICE_UNAVAILABLE", "Try again later.")).toBe(true);
    expect(await failImageGeneration(job.id, lease, "OTHER", "Wrong message")).toBe(false);
    expect(await readImageGeneration(editor, job.id)).toMatchObject({ status: "failed", errorCode: "SERVICE_UNAVAILABLE", errorMessage: "Try again later." });
    expect(await completeImageGeneration(job.id, lease, output())).toBeNull();
  });
});
