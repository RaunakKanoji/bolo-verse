import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/server/db/client", () => ({
  withDatabase: <T>(operation: (db: typeof database) => Promise<T>) => operation(database),
}));
import * as schema from "@/server/db/schema";
import { bootstrapPersonalWorkspace } from "@/server/db/projects";
import {
  readVideoEditorDraft,
  saveVideoEditorDraft,
  createVideoRender,
  listVideoRenders,
  readVideoRender,
  claimVideoRender,
  markVideoRenderDispatch,
  recordVideoProviderJob,
  releaseVideoRenderLease,
  completeVideoRender,
  failVideoRender,
  readVideoRenderClaim,
} from "@/server/db/video-editor";
const postgres = new PGlite();
const database = drizzle(postgres, { schema });
const projectId = "a1000000-0000-4000-8000-000000000001",
  assetId = "a2000000-0000-4000-8000-000000000001";
const owner = "video_owner",
  editor = "video_editor",
  client = "video_client";
const document = () => ({
  schemaVersion: 1 as const,
  aspectRatio: "16:9" as const,
  clips: [
    {
      id: randomUUID(),
      assetId,
      startSeconds: 0,
      durationSeconds: 5,
      trimStartSeconds: 0,
      audioLevel: 1,
    },
  ],
  overlays: [],
});
const input = () => ({
  idempotencyKey: randomUUID(),
  draftRevision: 1,
  consent: "shotstack-render-v1" as const,
});
const create = async (subject = owner, request = input()) => {
  if ((await readVideoEditorDraft(subject, projectId)).revision === 0)
    await saveVideoEditorDraft(subject, projectId, { expectedRevision: 0, document: document() });
  return createVideoRender(subject, projectId, request, "sandbox");
};
beforeAll(async () => {
  const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8")) as {
    entries: { tag: string }[];
  };
  for (const { tag } of journal.entries)
    await postgres.exec(await readFile(`drizzle/${tag}.sql`, "utf8"));
}, 90_000);
beforeEach(async () => {
  await postgres.exec("TRUNCATE workspaces, rate_limit_buckets CASCADE");
  const workspace = await bootstrapPersonalWorkspace(database, owner);
  await database.insert(schema.projects).values({
    id: projectId,
    workspaceId: workspace.id,
    name: "Video",
    objective: "Private edits",
    createdByClerkId: owner,
  });
  await database.insert(schema.projectMembers).values([
    { projectId, clerkUserId: editor, role: "editor" },
    { projectId, clerkUserId: client, role: "client" },
  ]);
  await database.insert(schema.assets).values({
    id: assetId,
    projectId,
    ownerClerkId: owner,
    objectKey: "private/source.png",
    mimeType: "image/png",
    byteSize: 128,
    checksumSha256: "a".repeat(64),
    status: "ready",
  });
});
afterAll(async () => {
  await postgres.close();
});
describe("private video draft and durable render SQL", () => {
  it("keeps drafts actor private, checks edit access and prevents lost revisions", async () => {
    expect(await readVideoEditorDraft(owner, projectId)).toMatchObject({
      document: null,
      revision: 0,
    });
    const saved = await saveVideoEditorDraft(owner, projectId, {
      expectedRevision: 0,
      document: document(),
    });
    expect(saved.revision).toBe(1);
    expect((await readVideoEditorDraft(editor, projectId)).document).toBeNull();
    await expect(
      saveVideoEditorDraft(owner, projectId, { expectedRevision: 0, document: document() }),
    ).rejects.toMatchObject({ status: 409 });
    await expect(readVideoEditorDraft(client, projectId)).rejects.toMatchObject({ status: 403 });
    await expect(readVideoEditorDraft("outsider", projectId)).rejects.toMatchObject({
      status: 403,
    });
  });
  it("renders saved exact revision, snapshots sources and rejects unknown or unchecked assets", async () => {
    await expect(
      saveVideoEditorDraft(owner, projectId, {
        expectedRevision: 0,
        document: { ...document(), clips: [{ ...document().clips[0], assetId: randomUUID() }] },
      }),
    ).rejects.toMatchObject({ status: 400 });
    const request = input(),
      job = await create(owner, request);
    expect(await createVideoRender(owner, projectId, request, "sandbox")).toEqual(job);
    await expect(
      createVideoRender(owner, projectId, { ...request, draftRevision: 2 }, "sandbox"),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      createVideoRender(owner, projectId, { ...input(), draftRevision: 2 }, "sandbox"),
    ).rejects.toMatchObject({ status: 409 });
    const stored = (
      await postgres.query<{ source_snapshot: unknown }>(
        "SELECT source_snapshot FROM video_render_requests",
      )
    ).rows[0];
    expect(JSON.stringify(stored.source_snapshot)).toContain("private/source.png");
    await expect(
      postgres.exec("UPDATE video_render_requests SET document='{}'::jsonb"),
    ).rejects.toThrow(/immutable/);
    expect(JSON.stringify(job)).not.toMatch(/provider|objectKey|checksum|ownerClerkId/);
    expect(await listVideoRenders(editor, projectId)).toEqual([]);
    await expect(readVideoRender(editor, projectId, job.id)).rejects.toMatchObject({ status: 403 });
  });
  it("accepts verified recordings with unknown duration and rejects exact overruns only when duration is known", async () => {
    const unknownId = randomUUID(),
      knownId = randomUUID();
    await database.insert(schema.assets).values([
      {
        id: unknownId,
        projectId,
        ownerClerkId: owner,
        objectKey: `private/recordings/${unknownId}.webm`,
        mimeType: "video/webm",
        byteSize: 128,
        checksumSha256: "c".repeat(64),
        status: "ready",
        durationSeconds: null,
      },
      {
        id: knownId,
        projectId,
        ownerClerkId: owner,
        objectKey: `private/recordings/${knownId}.mp4`,
        mimeType: "video/mp4",
        byteSize: 128,
        checksumSha256: "d".repeat(64),
        status: "ready",
        durationSeconds: 5,
      },
    ]);
    const edit = document();
    edit.clips[0].assetId = unknownId;
    edit.clips[0].trimStartSeconds = 2;
    expect(
      (await saveVideoEditorDraft(owner, projectId, { expectedRevision: 0, document: edit }))
        .revision,
    ).toBe(1);
    const job = await createVideoRender(owner, projectId, input(), "sandbox");
    const claim = await claimVideoRender(owner, projectId, job.id, "submit");
    expect(claim?.request.sourceSnapshot[0].durationSeconds).toBeNull();
    await expect(
      saveVideoEditorDraft(owner, projectId, {
        expectedRevision: 1,
        document: {
          ...edit,
          clips: [
            { ...edit.clips[0], assetId: knownId, trimStartSeconds: 0, durationSeconds: 5.0005 },
          ],
        },
      }),
    ).rejects.toMatchObject({ status: 400 });
  });
  it("claims and dispatches once, retains provider ID privately and safely refreshes", async () => {
    const job = await create();
    const claim = await claimVideoRender(owner, projectId, job.id, "submit");
    expect(claim).not.toBeNull();
    expect(await readVideoRenderClaim(claim!)).not.toBeNull();
    expect(await claimVideoRender(owner, projectId, job.id, "submit")).toBeNull();
    expect(await markVideoRenderDispatch(claim!)).toBe(true);
    expect(await markVideoRenderDispatch(claim!)).toBe(false);
    expect(await recordVideoProviderJob(claim!, "provider-test")).toBe(true);
    await releaseVideoRenderLease(claim!);
    expect(await claimVideoRender(owner, projectId, job.id, "submit")).toBeNull();
    const refresh = await claimVideoRender(owner, projectId, job.id, "refresh");
    expect(refresh?.job.providerJobId).toBe("provider-test");
    const complete = await completeVideoRender(refresh!, {
      objectKey: `private/recordings/${projectId}/${job.id}/test.mp4`,
      byteSize: 128,
      checksumSha256: "b".repeat(64),
      mimeType: "video/mp4",
    });
    expect(complete?.outputAsset).toMatchObject({
      mimeType: "video/mp4",
      width: null,
      durationSeconds: null,
    });
    expect((await readVideoRender(owner, projectId, job.id)).status).toBe("ready");
    expect(
      await completeVideoRender(refresh!, {
        objectKey: "other",
        byteSize: 128,
        checksumSha256: "b".repeat(64),
        mimeType: "video/mp4",
      }),
    ).toBeNull();
  });
  it("does not redispatch ambiguous expired submissions and rejects revoked final writes", async () => {
    const job = await create(editor);
    const claim = (await claimVideoRender(editor, projectId, job.id, "submit"))!;
    await markVideoRenderDispatch(claim);
    await postgres.query(
      "UPDATE processing_jobs SET lease_expires_at=now()-interval '1 second' WHERE id=$1",
      [job.id],
    );
    expect(await claimVideoRender(editor, projectId, job.id, "submit")).toBeNull();
    expect(await readVideoRender(editor, projectId, job.id)).toMatchObject({
      status: "failed",
      failureCode: "SHOTSTACK_DISPATCH_UNCERTAIN",
    });
    const other = await create(editor);
    const active = (await claimVideoRender(editor, projectId, other.id, "submit"))!;
    await postgres.query("DELETE FROM project_members WHERE clerk_user_id=$1", [editor]);
    expect(await readVideoRenderClaim(active)).toBeNull();
    expect(await markVideoRenderDispatch(active)).toBe(false);
    expect(
      await completeVideoRender(active, {
        objectKey: "private/recordings/no.mp4",
        byteSize: 128,
        checksumSha256: "b".repeat(64),
        mimeType: "video/mp4",
      }),
    ).toBeNull();
    expect(await failVideoRender(active, "ACCESS_CHANGED", "Access changed.")).toBe(true);
    await expect(readVideoRender(editor, projectId, other.id)).rejects.toMatchObject({
      status: 403,
    });
  });
  it("does not publish after an immutable source disappears during storage latency", async () => {
    const job = await create();
    const claim = (await claimVideoRender(owner, projectId, job.id, "submit"))!;
    await postgres.query("DELETE FROM assets WHERE id=$1", [assetId]);
    expect(
      await completeVideoRender(claim, {
        objectKey: "private/recordings/missing.mp4",
        byteSize: 128,
        checksumSha256: "b".repeat(64),
        mimeType: "video/mp4",
      }),
    ).toBeNull();
    expect((await postgres.query("SELECT id FROM assets")).rows).toHaveLength(0);
  });
  it("bounds active work and hourly actor/project budget without charging retries", async () => {
    const request = input(),
      first = await create(owner, request);
    await create();
    await expect(create()).rejects.toMatchObject({ status: 429 });
    expect((await createVideoRender(owner, projectId, request, "sandbox")).id).toBe(first.id);
    for (let n = 0; n < 3; n++) {
      await postgres.exec("UPDATE processing_jobs SET status='failed'");
      await create();
    }
    await postgres.exec("UPDATE processing_jobs SET status='failed'");
    await expect(create()).rejects.toMatchObject({ status: 429 });
  });
});
