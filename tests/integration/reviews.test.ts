import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  nativeTestPublicKey,
  nativeTestPublishableKey,
  sessionJWT,
} from "../helpers/native-session";
vi.mock("server-only", () => ({}));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: null }) }));
const boundary = vi.hoisted(() => ({ recipient: vi.fn(), image: vi.fn(), preview: vi.fn() }));
vi.mock("@/server/auth/review-recipient", () => ({ verifyReviewRecipient: boundary.recipient }));
vi.mock("@/server/providers/r2-ingestion", () => ({ readStagedImage: boundary.image }));
vi.mock("@/server/providers/r2-preview", () => ({
  R2PreviewReader: class {
    readObject = boundary.preview;
  },
}));
vi.mock("@/server/db/client", () => ({
  withDatabase: <T>(fn: (db: typeof database) => Promise<T>) => fn(database),
}));
import * as schema from "@/server/db/schema";
import { bootstrapPersonalWorkspace } from "@/server/db/projects";
import { createAssetUploadSession, completeImageUpload } from "@/server/db/asset-ingestions";
import { publishDeliverable } from "@/server/services/deliverables";
import {
  GET as FEEDBACK,
  POST as SHARE,
} from "@/app/api/v1/projects/[projectId]/deliverables/[deliverableId]/review-grants/route";
import { POST as REVOKE } from "@/app/api/v1/projects/[projectId]/deliverables/[deliverableId]/review-grants/[grantId]/revoke/route";
import { GET as REVIEW } from "@/app/api/v1/reviews/[versionId]/route";
import { GET as INBOX } from "@/app/api/v1/reviews/route";
import { POST as COMMENT } from "@/app/api/v1/reviews/[versionId]/comments/route";
import { POST as DECIDE } from "@/app/api/v1/reviews/[versionId]/decision/route";
import { GET as MEDIA } from "@/app/api/v1/reviews/[versionId]/content/route";
import { GET as GENERIC_ASSET } from "@/app/api/v1/assets/[assetId]/content/route";
import { GET as PROJECT } from "@/app/api/v1/projects/[projectId]/route";
import { GET as BRIEF } from "@/app/api/v1/projects/[projectId]/brief/route";
const postgres = new PGlite(),
  database = drizzle(postgres, { schema });
const projectId = "f1000000-0000-4000-8000-000000000001";
const owner = "user_reviewOwner",
  editor = "user_reviewEditor",
  reviewer = "user_reviewClient",
  outsider = "user_reviewOther";
const bytes = new Uint8Array(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVQImWMwMjL6DwACxgGWgWwZRAAAAABJRU5ErkJggg==",
    "base64",
  ),
);
let versionId = "",
  assetId = "";
function request(subject = owner, body?: unknown) {
  return new Request("http://localhost:3000/api/v1/reviews", {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: `Bearer ${sessionJWT(subject)}`, "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
const creatorContext = () => ({ params: Promise.resolve({ projectId, deliverableId: versionId }) });
const reviewContext = (id = versionId) => ({ params: Promise.resolve({ versionId: id }) });
async function share(subject = owner, patch = {}) {
  const response = await SHARE(
    request(subject, { reviewerId: reviewer, idempotencyKey: randomUUID(), ...patch }),
    creatorContext(),
  );
  return response;
}
async function assigned() {
  const response = await share();
  expect(response.status).toBe(201);
  return (await response.json()).data.grant as { grantId: string; expiresAt: string };
}
const read = (subject = reviewer, id = versionId) => REVIEW(request(subject), reviewContext(id));
const action = (grantId: string, patch = {}) => ({
  grantId,
  expectedVersion: 1,
  idempotencyKey: randomUUID(),
  ...patch,
});
const revoke = (grantId: string, subject = owner) =>
  REVOKE(request(subject, {}), {
    params: Promise.resolve({ projectId, deliverableId: versionId, grantId }),
  });
beforeAll(async () => {
  const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8"));
  for (const { tag } of journal.entries)
    await postgres.exec(await readFile(`drizzle/${tag}.sql`, "utf8"));
}, 30_000);
beforeEach(async () => {
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_configured");
  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", nativeTestPublishableKey);
  vi.stubEnv("CLERK_JWT_KEY", nativeTestPublicKey);
  vi.stubEnv("DATABASE_URL", "postgres://test");
  await postgres.exec("TRUNCATE workspaces, rate_limit_buckets CASCADE");
  const workspace = await bootstrapPersonalWorkspace(database, owner);
  await database
    .insert(schema.projects)
    .values({
      id: projectId,
      workspaceId: workspace.id,
      name: "Scoped review",
      objective: "One poster",
      createdByClerkId: owner,
    });
  await database
    .insert(schema.projectMembers)
    .values({ projectId, clerkUserId: editor, role: "editor" });
  const upload = await createAssetUploadSession(owner, {
    projectId,
    fileName: "poster.png",
    mimeType: "image/png",
    byteSize: bytes.length,
    checksumSha256: createHash("sha256").update(bytes).digest("hex"),
    idempotencyKey: randomUUID(),
  });
  assetId = (await completeImageUpload(owner, upload.id, { width: 1, height: 1 })).id;
  boundary.image.mockReset().mockResolvedValue({ bytes, mimeType: "image/png" });
  versionId = (
    await publishDeliverable(owner, projectId, {
      assetId,
      title: "Private poster",
      idempotencyKey: randomUUID(),
    })
  ).deliverableId;
  boundary.preview.mockReset().mockResolvedValue({ bytes, mimeType: "image/png" });
  boundary.recipient.mockReset().mockImplementation(async (id: string) => id);
});
afterAll(async () => {
  vi.unstubAllEnvs();
  await postgres.close();
});
describe("identity-bound version review", () => {
  it("grants one real subject only the selected version, without project membership or generic media access", async () => {
    const grant = await assigned();
    expect(boundary.recipient).toHaveBeenCalledWith(reviewer);
    expect(await database.select().from(schema.projectMembers)).toHaveLength(1);
    const response = await read();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.review).toMatchObject({
      reviewId: versionId,
      grantId: grant.grantId,
      version: 1,
      title: "Private poster",
      decision: null,
    });
    expect(JSON.stringify(body)).not.toMatch(
      /objectKey|assetId|briefVersion|creatorId|secretHash|user_review|private\//,
    );
    expect(
      (await PROJECT(request(reviewer), { params: Promise.resolve({ projectId }) })).status,
    ).toBe(403);
    expect(
      (await BRIEF(request(reviewer), { params: Promise.resolve({ projectId }) })).status,
    ).toBe(403);
    expect(
      (await GENERIC_ASSET(request(reviewer), { params: Promise.resolve({ assetId }) })).status,
    ).toBe(403);
    expect((await read(outsider)).status).toBe(403);
    expect((await read(reviewer, randomUUID())).status).toBe(403);
    const inbox = await INBOX(request(reviewer));
    expect((await inbox.json()).data.reviews).toHaveLength(1);
    const media = await MEDIA(request(reviewer), reviewContext());
    expect(media.status).toBe(200);
    expect(media.headers.get("cache-control")).toContain("no-store");
    expect(new Uint8Array(await media.arrayBuffer())).toEqual(bytes);
  });
  it("authorizes before recipient lookup, rejects broad members and makes sharing idempotent", async () => {
    expect((await share(outsider)).status).toBe(403);
    expect(boundary.recipient).not.toHaveBeenCalled();
    expect((await share(owner, { reviewerId: editor })).status).toBe(409);
    const idempotencyKey = randomUUID();
    const first = await share(editor, { idempotencyKey });
    expect(first.status).toBe(201);
    const second = await share(editor, { idempotencyKey });
    expect((await first.json()).data).toEqual((await second.json()).data);
    expect(await database.select().from(schema.accessGrants)).toHaveLength(1);
    expect((await share(editor, { idempotencyKey, reviewerId: outsider })).status).toBe(409);
  });
  it("assigns an existing read-only client member an exact-version review without granting editing rights", async () => {
    await database.insert(schema.projectMembers).values({projectId, clerkUserId: reviewer, role: "client"});
    const grant = await assigned();
    expect((await read()).status).toBe(200);
    expect((await COMMENT(request(reviewer, {...action(grant.grantId), comment: "Please warm the background"}), reviewContext())).status).toBe(200);
    expect((await DECIDE(request(reviewer, {...action(grant.grantId), decision: "changes_requested", comment: "Warmer background"}), reviewContext())).status).toBe(200);
    expect((await FEEDBACK(request(owner), creatorContext())).status).toBe(200);
    expect((await share(owner, {reviewerId: owner})).status).toBe(409);
  });
  it("appends immutable comments and terminal decisions, with exact retry and deterministic duplicate conflicts", async () => {
    const grant = await assigned();
    const body = action(grant.grantId, { comment: "Please adjust colour" });
    expect((await COMMENT(request(reviewer, body), reviewContext())).status).toBe(200);
    expect((await COMMENT(request(reviewer, body), reviewContext())).status).toBe(200);
    expect(
      (await COMMENT(request(reviewer, { ...body, comment: "Changed" }), reviewContext())).status,
    ).toBe(409);
    const decision = action(grant.grantId, {
      decision: "changes_requested",
      comment: "Use a darker background",
    });
    expect((await DECIDE(request(reviewer, decision), reviewContext())).status).toBe(200);
    expect((await DECIDE(request(reviewer, decision), reviewContext())).status).toBe(200);
    expect(
      (
        await DECIDE(
          request(reviewer, action(grant.grantId, { decision: "approved" })),
          reviewContext(),
        )
      ).status,
    ).toBe(409);
    expect(
      (
        await COMMENT(
          request(reviewer, action(grant.grantId, { comment: "Late" })),
          reviewContext(),
        )
      ).status,
    ).toBe(409);
    expect(await database.select().from(schema.reviewComments)).toHaveLength(1);
    expect(await database.select().from(schema.reviewDecisions)).toHaveLength(1);
    await expect(postgres.query("UPDATE review_comments SET comment='altered'")).rejects.toThrow(
      /immutable|append/i,
    );
    await expect(postgres.query("DELETE FROM review_comments")).rejects.toThrow(
      /immutable|append/i,
    );
    await expect(postgres.query("UPDATE review_decisions SET decision='approved'")).rejects.toThrow(
      /immutable|append/i,
    );
    const feedback = await FEEDBACK(request(), creatorContext());
    expect((await feedback.json()).data.feedback.latestDecision.decision).toBe("changes_requested");
  });
  it("binds stale/mismatched versions and ignores forged actor fields", async () => {
    const grant = await assigned();
    expect(
      (
        await DECIDE(
          request(reviewer, action(grant.grantId, { expectedVersion: 2, decision: "approved" })),
          reviewContext(),
        )
      ).status,
    ).toBe(409);
    expect(
      (
        await DECIDE(
          request(outsider, action(grant.grantId, { decision: "approved" })),
          reviewContext(),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await COMMENT(
          request(reviewer, action(grant.grantId, { comment: "x", actorId: owner })),
          reviewContext(),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await COMMENT(
          request(reviewer, action(grant.grantId, { comment: "x".repeat(2001) })),
          reviewContext(),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await DECIDE(
          request(reviewer, action(randomUUID(), { decision: "approved" })),
          reviewContext(),
        )
      ).status,
    ).toBe(403);
  });
  it("revokes and expires grant access to APIs, inbox, mutations and media", async () => {
    const grant = await assigned();
    expect((await revoke(grant.grantId, outsider)).status).toBe(403);
    expect((await revoke(grant.grantId)).status).toBe(200);
    expect((await revoke(grant.grantId)).status).toBe(200);
    expect((await read()).status).toBe(403);
    expect((await MEDIA(request(reviewer), reviewContext())).status).toBe(403);
    expect(
      (
        await DECIDE(
          request(reviewer, action(grant.grantId, { decision: "approved" })),
          reviewContext(),
        )
      ).status,
    ).toBe(403);
    expect((await (await INBOX(request(reviewer))).json()).data.reviews).toEqual([]);
    const next = await assigned();
    await postgres.query(
      "UPDATE access_grants SET expires_at=now()-interval '1 second' WHERE id=$1",
      [next.grantId],
    );
    expect((await read()).status).toBe(403);
    expect((await MEDIA(request(reviewer), reviewContext())).status).toBe(403);
  });
  it("rechecks recipient permission after storage latency and at byte delivery", async () => {
    const grant = await assigned();
    let release!: (value: { bytes: Uint8Array; mimeType: string }) => void, started!: () => void;
    const begun = new Promise<void>((resolve) => {
      started = resolve;
    });
    boundary.preview.mockImplementationOnce(() => {
      started();
      return new Promise((resolve) => {
        release = resolve;
      });
    });
    const pending = MEDIA(request(reviewer), reviewContext());
    await begun;
    await revoke(grant.grantId);
    release({ bytes, mimeType: "image/png" });
    expect((await pending).status).toBe(403);
    const next = await assigned();
    const response = await MEDIA(request(reviewer), reviewContext());
    expect(response.status).toBe(200);
    await revoke(next.grantId);
    await expect(response.arrayBuffer()).rejects.toThrow();
  });
  it("keeps old granted versions visible without allowing decisions to bind to another version", async () => {
    const first = await assigned();
    const secondVersion = (
      await publishDeliverable(owner, projectId, {
        assetId,
        title: "Second poster",
        idempotencyKey: randomUUID(),
      })
    ).deliverableId;
    expect((await read(reviewer, secondVersion)).status).toBe(403);
    const second = await SHARE(
      request(owner, { reviewerId: reviewer, idempotencyKey: randomUUID() }),
      { params: Promise.resolve({ projectId, deliverableId: secondVersion }) },
    );
    expect(second.status).toBe(201);
    expect((await read()).status).toBe(200);
    expect((await read(reviewer, secondVersion)).status).toBe(200);
    expect(
      (
        await DECIDE(
          request(reviewer, action(first.grantId, { decision: "approved", expectedVersion: 2 })),
          reviewContext(secondVersion),
        )
      ).status,
    ).toBe(403);
    expect((await (await INBOX(request(reviewer))).json()).data.reviews).toHaveLength(2);
  });
  it("serializes conflicting decisions and converges exact concurrent retries", async () => {
    const grant = await assigned();
    const body = action(grant.grantId, { comment: "Concurrent comment" });
    const comments = await Promise.all([
      COMMENT(request(reviewer, body), reviewContext()),
      COMMENT(request(reviewer, body), reviewContext()),
    ]);
    expect(comments.map((response) => response.status)).toEqual([200, 200]);
    expect(await database.select().from(schema.reviewComments)).toHaveLength(1);
    const decisions = await Promise.all([
      DECIDE(request(reviewer, action(grant.grantId, { decision: "approved" })), reviewContext()),
      DECIDE(
        request(reviewer, action(grant.grantId, { decision: "changes_requested" })),
        reviewContext(),
      ),
    ]);
    expect(decisions.map((response) => response.status).sort()).toEqual([200, 409]);
    expect(await database.select().from(schema.reviewDecisions)).toHaveLength(1);
  });
  it("rechecks the creator after real-recipient lookup latency", async () => {
    let release!: (subject: string) => void, started!: () => void;
    const begun = new Promise<void>((resolve) => {
      started = resolve;
    });
    boundary.recipient.mockImplementationOnce(() => {
      started();
      return new Promise((resolve) => {
        release = resolve;
      });
    });
    const pending = share(editor);
    await begun;
    await postgres.query("DELETE FROM project_members WHERE clerk_user_id=$1", [editor]);
    release(reviewer);
    expect((await pending).status).toBe(403);
    expect(await database.select().from(schema.accessGrants)).toHaveLength(0);
  });
  it("checks identity, trusted Origin and JSON boundaries without a public review bypass", async () => {
    const grant = await assigned();
    const anonymous = request(reviewer);
    anonymous.headers.delete("Authorization");
    const anonymousResponse = await REVIEW(anonymous, reviewContext());
    expect(anonymousResponse.status, JSON.stringify(await anonymousResponse.json())).toBe(401);
    const forged = request(reviewer);
    forged.headers.set("Authorization", "Bearer forged");
    expect((await REVIEW(forged, reviewContext())).status).toBe(401);
    const hostile = request(reviewer, action(grant.grantId, { decision: "approved" }));
    hostile.headers.set("Origin", "https://attacker.test");
    expect((await DECIDE(hostile, reviewContext())).status).toBe(403);
    expect(
      (
        await COMMENT(
          request(reviewer, action(grant.grantId, { comment: "x".repeat(17000) })),
          reviewContext(),
        )
      ).status,
    ).toBe(413);
    expect((await read(reviewer, "invalid")).status).toBe(400);
  });
  it.each(["share", "revoke"] as const)(
    "rechecks creator membership in the final %s SQL write",
    async (operation) => {
      const grant = operation === "revoke" ? await assigned() : null;
      const original = postgres.transaction.bind(postgres);
      const interceptor = vi.spyOn(postgres, "transaction").mockImplementation((callback) =>
        original(async (tx) => {
          const execute = tx.query.bind(tx);
          let changed = false;
          const hooked = async (...args: Parameters<typeof tx.query>) => {
            const target =
              operation === "share"
                ? /insert into "access_grants"/i
                : /update "access_grants".*coalesce/is;
            if (!changed && target.test(args[0])) {
              changed = true;
              await execute("DELETE FROM project_members WHERE clerk_user_id=$1", [editor]);
            }
            return execute(...args);
          };
          vi.spyOn(tx, "query").mockImplementation(hooked as typeof tx.query);
          return callback(tx);
        }),
      );
      try {
        const response =
          operation === "share" ? await share(editor) : await revoke(grant!.grantId, editor);
        expect(response.status).toBe(403);
      } finally {
        interceptor.mockRestore();
      }
    },
  );
});
