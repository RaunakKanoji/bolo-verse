import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { beforeAll, beforeEach, afterAll, describe, expect, it, vi } from "vitest";
import {
  nativeTestPublicKey,
  nativeTestPublishableKey,
  sessionJWT,
} from "../helpers/native-session";
vi.mock("server-only", () => ({}));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: null }) }));
const boundary = vi.hoisted(() => ({ image: vi.fn(), recipient: vi.fn() }));
vi.mock("@/server/providers/r2-ingestion", () => ({ readStagedImage: boundary.image }));
vi.mock("@/server/auth/review-recipient", () => ({ verifyReviewRecipient: boundary.recipient }));
vi.mock("@/server/db/client", () => ({
  withDatabase: <T>(fn: (database: typeof db) => Promise<T>) => fn(db),
}));
import * as schema from "@/server/db/schema";
import { bootstrapPersonalWorkspace } from "@/server/db/projects";
import { createAssetUploadSession, completeImageUpload } from "@/server/db/asset-ingestions";
import { POST, GET } from "@/app/api/v1/projects/[projectId]/deliverables/route";
import { POST as SHARE } from "@/app/api/v1/projects/[projectId]/deliverables/[deliverableId]/review-grants/route";
import { POST as DECIDE } from "@/app/api/v1/reviews/[versionId]/decision/route";
import { GET as REVIEW } from "@/app/api/v1/reviews/[versionId]/route";
import { POST as REVOKE } from "@/app/api/v1/projects/[projectId]/deliverables/[deliverableId]/review-grants/[grantId]/revoke/route";
const pg = new PGlite(),
  db = drizzle(pg, { schema });
const projectId = "81000000-0000-4000-8000-000000000001",
  otherId = "81000000-0000-4000-8000-000000000002";
const owner = "user_revisionOwner",
  editor = "user_revisionEditor",
  reviewer = "user_revisionClient",
  outsider = "user_revisionOther";
const objects = new Map<string, Uint8Array>();
let firstAsset = "",
  newAsset = "",
  parentId = "",
  decisionId = "",
  grantId = "";
function request(actor: string, body?: unknown) {
  return new Request("http://localhost:3000/api/v1/projects", {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: `Bearer ${sessionJWT(actor)}`, "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
const context = (id = projectId) => ({ params: Promise.resolve({ projectId: id }) });
const publish = (body: unknown, actor = owner, id = projectId) =>
  POST(request(actor, body), context(id));
const read = (id: string, actor = reviewer) =>
  REVIEW(request(actor), { params: Promise.resolve({ versionId: id }) });
const input = (patch = {}) => ({
  assetId: newAsset,
  title: "Revised poster",
  idempotencyKey: randomUUID(),
  revision: { supersedesVersionId: parentId, expectedVersion: 1, expectedDecisionId: decisionId },
  ...patch,
});
async function upload(colour: string, id = projectId, actor = owner) {
  // Real 2x2 RGBA PNGs generated through the application's existing sharp codec.
  const pngs: Record<string, string> = {
    "#333333":
      "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEUlEQVQImWMwNjb+D8IMMAYANKoGYQZLqOAAAAAASUVORK5CYII=",
    "#777777":
      "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEUlEQVQImWMoLy//D8IMMAYAUvIJkXbKFyEAAAAASUVORK5CYII=",
    "#ffffff":
      "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADklEQVQImWP4DwUMMAYAj4IP8cvlVgcAAAAASUVORK5CYII=",
    "#aaaaaa":
      "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEUlEQVQImWNYtWrVfxBmgDEAaagL9fQVbdgAAAAASUVORK5CYII=",
    "#abcdef":
      "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEUlEQVQImWNYffb9fxBmgDEAeC4Nmfk4djsAAAAASUVORK5CYII=",
  };
  const bytes = new Uint8Array(Buffer.from(pngs[colour], "base64"));
  const session = await createAssetUploadSession(actor, {
    projectId: id,
    fileName: "poster.png",
    mimeType: "image/png",
    byteSize: bytes.length,
    checksumSha256: createHash("sha256").update(bytes).digest("hex"),
    idempotencyKey: randomUUID(),
  });
  const asset = await completeImageUpload(actor, session.id, { width: 2, height: 2 });
  objects.set(`private/images/${id}/${asset.id}`, bytes);
  return asset.id;
}
async function share(id: string) {
  const response = await SHARE(
    request(owner, { reviewerId: reviewer, idempotencyKey: randomUUID() }),
    { params: Promise.resolve({ projectId, deliverableId: id }) },
  );
  expect(response.status).toBe(201);
  return (await response.json()).data.grant.grantId as string;
}
async function decide(id: string, grant: string, version: number, decision = "changes_requested") {
  const key = randomUUID();
  const response = await DECIDE(
    request(reviewer, {
      grantId: grant,
      expectedVersion: version,
      idempotencyKey: key,
      decision,
      comment: "Change the background",
    }),
    { params: Promise.resolve({ versionId: id }) },
  );
  expect(response.status).toBe(200);
  return key;
}
beforeAll(async () => {
  const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8"));
  for (const { tag } of journal.entries)
    await pg.exec(await readFile(`drizzle/${tag}.sql`, "utf8"));
}, 30_000);
beforeEach(async () => {
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_configured");
  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", nativeTestPublishableKey);
  vi.stubEnv("CLERK_JWT_KEY", nativeTestPublicKey);
  vi.stubEnv("DATABASE_URL", "postgres://test");
  await pg.exec("TRUNCATE workspaces, rate_limit_buckets CASCADE");
  objects.clear();
  const workspace = await bootstrapPersonalWorkspace(db, owner),
    other = await bootstrapPersonalWorkspace(db, outsider);
  await db.insert(schema.projects).values([
    {
      id: projectId,
      workspaceId: workspace.id,
      name: "Revisions",
      objective: "Poster",
      createdByClerkId: owner,
    },
    {
      id: otherId,
      workspaceId: other.id,
      name: "Other",
      objective: "Private",
      createdByClerkId: outsider,
    },
  ]);
  await db.insert(schema.projectMembers).values({ projectId, clerkUserId: editor, role: "editor" });
  boundary.recipient.mockReset().mockImplementation(async (id: string) => id);
  boundary.image.mockReset().mockImplementation(async ({ objectKey }: { objectKey: string }) => ({
    bytes: objects.get(objectKey)!,
    mimeType: "image/png",
  }));
  firstAsset = await upload("#333333");
  newAsset = await upload("#777777");
  const response = await publish({
    assetId: firstAsset,
    title: "Original",
    idempotencyKey: randomUUID(),
  });
  expect(response.status).toBe(201);
  parentId = (await response.json()).data.deliverable.deliverableId;
  grantId = await share(parentId);
  decisionId = await decide(parentId, grantId, 1);
});
afterAll(async () => {
  vi.unstubAllEnvs();
  await pg.close();
});
describe("reviewed revisions", () => {
  it("rechecks all history grants after scanning later versions", async () => {
    const revised = (await (await publish(input())).json()).data.deliverable;
    const nextGrant = await share(revised.deliverableId);
    const original = pg.query.bind(pg);
    let selectedReads = 0;
    const intercept = vi.spyOn(pg, "query").mockImplementation((async (
      ...args: Parameters<typeof pg.query>
    ) => {
      if (
        /from "access_grants"/i.test(args[0]) &&
        Array.isArray(args[1]) &&
        args[1].includes(parentId) &&
        ++selectedReads === 2
      ) {
        await original("UPDATE access_grants SET revoked_at=now() WHERE id=$1", [nextGrant]);
      }
      return original(...args);
    }) as typeof pg.query);
    try {
      const response = await read(parentId);
      expect(response.status).toBe(200);
      expect(
        (await response.json()).data.review.history.map(
          (item: { version: number }) => item.version,
        ),
      ).toEqual([1]);
    } finally {
      intercept.mockRestore();
    }
  });
  it("publishes a distinct immutable v2 without carrying v1 decision or grant, then explicitly submits it", async () => {
    const before = (await read(parentId)).clone();
    const oldRows = await db.select().from(schema.contentVersions),
      oldDecision = await db.select().from(schema.reviewDecisions);
    const body = input(),
      response = await publish(body, editor);
    expect(response.status).toBe(201);
    const v2 = (await response.json()).data.deliverable;
    expect(v2).toMatchObject({
      version: 2,
      source: { revision: body.revision, assetId: newAsset },
    });
    expect(v2.source.checksumSha256).not.toBe(
      (oldRows[0].sourceSnapshot as { checksumSha256: string }).checksumSha256,
    );
    expect(
      (await db.select().from(schema.contentVersions)).find((row) => row.id === parentId),
    ).toEqual(oldRows[0]);
    expect(await db.select().from(schema.reviewDecisions)).toEqual(oldDecision);
    expect(await db.select().from(schema.accessGrants)).toHaveLength(1);
    expect((await read(v2.deliverableId)).status).toBe(403);
    await share(v2.deliverableId);
    const detail = (await (await read(v2.deliverableId)).json()).data.review;
    expect(detail.decision).toBeNull();
    expect(detail.comments).toEqual([]);
    expect(detail.history.map((item: { version: number }) => item.version)).toEqual([2, 1]);
    expect(detail.history[1].decision.id).toBe(decisionId);
    expect((await (await read(parentId)).json()).data.review.decision).toEqual(
      (await before.json()).data.review.decision,
    );
    const list = (await (await GET(request(owner), context())).json()).data.deliverables;
    expect(list.map((item: { version: number }) => item.version)).toEqual([2, 1]);
    expect(list[0].source.revision).toEqual(body.revision);
    expect((await read(v2.deliverableId, outsider)).status).toBe(403);
    await REVOKE(request(owner, {}), {
      params: Promise.resolve({ projectId, deliverableId: parentId, grantId }),
    });
    expect(
      (await (await read(v2.deliverableId)).json()).data.review.history.map(
        (item: { version: number }) => item.version,
      ),
    ).toEqual([2]);
  });
  it("rejects unchanged images including a different upload with identical bytes", async () => {
    expect((await publish(input({ assetId: firstAsset }))).status).toBe(409);
    const same = await upload("#333333");
    expect((await publish(input({ assetId: same }))).status).toBe(409);
    expect(await db.select().from(schema.contentVersions)).toHaveLength(1);
  });
  it("requires a reviewed same-project exact parent and latest decision", async () => {
    for (const revision of [
      { supersedesVersionId: parentId, expectedVersion: 2, expectedDecisionId: decisionId },
      { supersedesVersionId: parentId, expectedVersion: 1, expectedDecisionId: randomUUID() },
      { supersedesVersionId: randomUUID(), expectedVersion: 1, expectedDecisionId: decisionId },
    ])
      expect((await publish(input({ revision }))).status).toBe(409);
    expect((await publish(input(), owner, otherId)).status).toBe(403);
    const foreign = await upload("#ffffff", otherId, outsider);
    const foreignParent = (
      await (
        await publish(
          { assetId: foreign, title: "Other", idempotencyKey: randomUUID() },
          outsider,
          otherId,
        )
      ).json()
    ).data.deliverable;
    expect(
      (
        await publish(
          input({
            revision: {
              supersedesVersionId: foreignParent.deliverableId,
              expectedVersion: foreignParent.version,
              expectedDecisionId: decisionId,
            },
          }),
        )
      ).status,
    ).toBe(409);
    const unreviewed = (
      await (
        await publish({ assetId: newAsset, title: "Not reviewed", idempotencyKey: randomUUID() })
      ).json()
    ).data.deliverable;
    expect(
      (
        await publish(
          input({
            revision: {
              supersedesVersionId: unreviewed.deliverableId,
              expectedVersion: unreviewed.version,
              expectedDecisionId: decisionId,
            },
          }),
        )
      ).status,
    ).toBe(409);
  });
  it("collapses concurrent retries, prevents competing successors and preserves exact retries after v3", async () => {
    const body = input();
    const responses = await Promise.all([publish(body), publish(body)]);
    expect(responses.map((r) => r.status)).toEqual([201, 201]);
    expect((await publish(input())).status).toBe(409);
    expect((await publish({ ...body, title: "Changed retry" })).status).toBe(409);
    const grant = await share(body.idempotencyKey),
      nextDecision = await decide(body.idempotencyKey, grant, 2);
    const nextAsset = await upload("#aaaaaa");
    expect(
      (
        await publish(
          input({
            assetId: nextAsset,
            revision: {
              supersedesVersionId: body.idempotencyKey,
              expectedVersion: 2,
              expectedDecisionId: nextDecision,
            },
          }),
        )
      ).status,
    ).toBe(201);
    expect((await publish(body)).status).toBe(201);
    expect(await db.select().from(schema.contentVersions)).toHaveLength(3);
  });
  it("rejects stale decisions and unauthorized actor/Origin/forged context", async () => {
    for (const actor of [reviewer, outsider])
      expect((await publish(input(), actor)).status).toBe(403);
    expect(
      (
        await publish(
          input({
            revision: {
              supersedesVersionId: parentId,
              expectedVersion: 1,
              expectedDecisionId: decisionId,
              actor: owner,
            },
          }),
        )
      ).status,
    ).toBe(400);
    const hostile = request(owner, input());
    hostile.headers.set("Origin", "https://other.test");
    expect((await POST(hostile, context())).status).toBe(403);
    const stale = await DECIDE(
      request(reviewer, {
        grantId,
        expectedVersion: 2,
        idempotencyKey: randomUUID(),
        decision: "approved",
      }),
      { params: Promise.resolve({ versionId: parentId }) },
    );
    expect(stale.status).toBe(409);
  });
  it("rechecks authorization and successor state after storage latency", async () => {
    const bytes = objects.get(`private/images/${projectId}/${newAsset}`)!;
    boundary.image.mockImplementationOnce(async () => {
      await pg.query("DELETE FROM project_members WHERE clerk_user_id=$1", [editor]);
      return { bytes, mimeType: "image/png" };
    });
    expect((await publish(input(), editor)).status).toBe(403);
    const first = input();
    boundary.image.mockImplementationOnce(async () => {
      expect((await publish(first)).status).toBe(201);
      return { bytes, mimeType: "image/png" };
    });
    expect((await publish(input())).status).toBe(409);
    expect(await db.select().from(schema.contentVersions)).toHaveLength(2);
  });
  it("rejects a changed latest parent decision after storage verification starts", async () => {
    boundary.image.mockImplementationOnce(async ({ objectKey }: { objectKey: string }) => {
      await db.insert(schema.reviewDecisions).values({
        projectId,
        contentVersionId: parentId,
        reviewerClerkId: outsider,
        decision: "approved",
      });
      return { bytes: objects.get(objectKey)!, mimeType: "image/png" };
    });
    expect((await publish(input())).status).toBe(409);
    expect(await db.select().from(schema.contentVersions)).toHaveLength(1);
  });
  it("serializes different submission keys into one successor", async () => {
    const responses = await Promise.all([publish(input()), publish(input())]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await db.select().from(schema.contentVersions)).toHaveLength(2);
  });
  it("supports a reviewed approved parent without carrying its approval forward", async () => {
    const second = (
      await (
        await publish({ assetId: newAsset, title: "Approved source", idempotencyKey: randomUUID() })
      ).json()
    ).data.deliverable;
    const grant = await share(second.deliverableId),
      approved = await decide(second.deliverableId, grant, second.version, "approved");
    const asset = await upload("#abcdef");
    const response = await publish(
      input({
        assetId: asset,
        revision: {
          supersedesVersionId: second.deliverableId,
          expectedVersion: second.version,
          expectedDecisionId: approved,
        },
      }),
    );
    expect(response.status).toBe(201);
    const revised = (await response.json()).data.deliverable;
    await share(revised.deliverableId);
    expect((await (await read(revised.deliverableId)).json()).data.review.decision).toBeNull();
  });
});
