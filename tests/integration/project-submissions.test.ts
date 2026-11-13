import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const identity = vi.hoisted(() => ({
  subject: "submission_client" as string | null,
  creator: { id: "demo_creator", banned: false, locked: false },
  fail: false,
}));
vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: identity.subject }),
  clerkClient: async () => ({
    users: {
      getUser: async () => {
        if (identity.fail) throw new Error("secret provider detail");
        return identity.creator;
      },
    },
  }),
}));
vi.mock("@/server/db/client", () => ({
  withDatabase: <T>(op: (db: typeof database) => Promise<T>) => op(database),
}));
import * as schema from "@/server/db/schema";
import { POST } from "@/app/api/projects/submissions/route";
import { readProjectAccess } from "@/server/db/projects";
import { readProjectBrief } from "@/server/db/project-briefs";
import { createAssetUploadSession, completeImageUpload, readOwnedImageUpload } from "@/server/db/asset-ingestions";
import { authorizeWorkspaceUpload, reserveWorkspaceUpload, finalizeWorkspaceUpload } from "@/server/db/workspace";
import { readProductionLibrary } from "@/server/db/production-artifacts";
import { saveProjectBrief } from "@/server/db/project-briefs";
const postgres = new PGlite();
const database = drizzle(postgres, { schema });
const input = () => ({
  idempotencyKey: randomUUID(),
  name: "Nova launch",
  description: "Introduce cold brew",
  brand: "Nova Coffee",
  contentType: "poster",
  audience: "Young professionals",
  objectives: "Introduce the premium cold brew",
  deliverables: "Social visual and campaign concept",
  channel: "Instagram",
  deadline: "2026-12-01",
  instructions: "Use the approved logo",
});
const request = (body: unknown, origin: string | null = "http://localhost:3000") =>
  new Request("http://localhost:3000/api/projects/submissions", {
    method: "POST",
    headers: { "content-type": "application/json", ...(origin ? { origin } : {}) },
    body: JSON.stringify(body),
  });
const post = (body = input()) => POST(request(body));
const data = async (response: Response) => (await response.json()).data;
beforeAll(async () => {
  const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8")) as {
    entries: { tag: string }[];
  };
  for (const { tag } of journal.entries)
    await postgres.exec(await readFile(`drizzle/${tag}.sql`, "utf8"));
}, 30_000);
beforeEach(async () => {
  identity.subject = "submission_client";
  identity.creator = { id: "demo_creator", banned: false, locked: false };
  identity.fail = false;
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_fixture");
  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_fixture");
  vi.stubEnv("DATABASE_URL", "postgres://test");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
  vi.stubEnv("ALLOWED_ORIGINS", "http://localhost:3000");
  vi.stubEnv("DEMO_CREATOR_CLERK_ID", "demo_creator");
  await postgres.exec("TRUNCATE workspaces, rate_limit_buckets CASCADE");
});
afterAll(async () => {
  vi.unstubAllEnvs();
  await postgres.close();
});
describe("client project submission", () => {
  it("atomically persists the rich brief and gives only the designated creator access", async () => {
    const body = input();
    const response = await post(body);
    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const saved = await data(response);
    expect(saved).toEqual({
      projectId: body.idempotencyKey,
      href: `/projects/${body.idempotencyKey}`,
    });
    expect((await readProjectAccess("demo_creator", saved.projectId)).canEdit).toBe(true);
    const brief = await readProjectBrief("demo_creator", saved.projectId);
    expect(brief).toMatchObject({
      version: 1,
      brief: {
        title: body.name,
        objective: body.objectives,
        product: body.brand,
        audience: body.audience,
        format: body.contentType,
        channels: [body.channel],
        deadline: body.deadline,
        notes: expect.stringContaining(body.deliverables),
      },
    });
    expect(brief.brief?.notes).toContain(body.description);
    expect(brief.brief?.notes).toContain(body.instructions);
    expect(
      (await postgres.query("SELECT studio_metadata->>'status' AS status FROM projects")).rows,
    ).toEqual([{ status: "active" }]);
    await expect(readProjectAccess("outsider", saved.projectId)).rejects.toMatchObject({
      status: 403,
    });
  });
  it("deduplicates concurrent retries and rejects changed or cross-user keys", async () => {
    const body = input();
    const responses = await Promise.all([post(body), post(body)]);
    expect(responses.map((r) => r.status)).toEqual([201, 201]);
    expect(await data(responses[0])).toEqual(await data(responses[1]));
    expect((await post({ ...body, name: "Changed" })).status).toBe(409);
    identity.subject = "other_client";
    expect((await post(body)).status).toBe(409);
    expect((await postgres.query("SELECT id FROM projects")).rows).toHaveLength(1);
    expect((await postgres.query("SELECT id FROM brief_versions")).rows).toHaveLength(1);
    expect((await postgres.query("SELECT count FROM rate_limit_buckets")).rows).toEqual([
      { count: 1 },
    ]);
  });
  it("does not restore revoked creator membership on retry", async () => {
    const body = input();
    await post(body);
    await postgres.query("DELETE FROM project_members WHERE clerk_user_id='demo_creator'");
    await postgres.query("DELETE FROM workspace_members WHERE clerk_user_id='demo_creator'");
    expect((await post(body)).status).toBe(201);
    await expect(readProjectAccess("demo_creator", body.idempotencyKey)).rejects.toMatchObject({
      status: 403,
    });
  });
  it("keeps client intake uploads separate from creator production permissions", async () => {
    const body = input();
    expect((await post(body)).status).toBe(201);
    const projectId = body.idempotencyKey;
    expect((await readProjectAccess("submission_client", projectId)).canEdit).toBe(false);
    expect((await readProjectAccess("demo_creator", projectId)).canEdit).toBe(true);
    expect((await postgres.query("SELECT personal_owner_clerk_id FROM workspaces")).rows).toEqual([{ personal_owner_clerk_id: "demo_creator" }]);
    const initial = await readProjectBrief("submission_client", projectId);
    expect(initial).toMatchObject({ version: 1, canEdit: false, brief: { constraints: expect.arrayContaining([`Deliverables: ${body.deliverables}`, `Special instructions: ${body.instructions}`]) } });
    await expect(readProductionLibrary("submission_client", projectId)).rejects.toMatchObject({ status: 403 });
    expect(await readProductionLibrary("demo_creator", projectId)).toMatchObject({ versions: [] });
    await saveProjectBrief("demo_creator", projectId, { expectedVersion: 1, idempotencyKey: randomUUID(), brief: { ...initial.brief!, objective: "Creator private proposed revision" } });
    expect((await readProjectBrief("submission_client", projectId)).version).toBe(1);
    await expect(saveProjectBrief("submission_client", projectId, { expectedVersion: 2, idempotencyKey: randomUUID(), brief: initial.brief! })).rejects.toMatchObject({ status: 403 });
    // Exercise persistence authorization only; these calls make no storage or codec claims.
    const image = await createAssetUploadSession("submission_client", { projectId, idempotencyKey: randomUUID(), fileName: "brand.png", mimeType: "image/png", byteSize: 10, checksumSha256: "a".repeat(64) });
    expect((await completeImageUpload("submission_client", image.id, { width: 1, height: 1 })).projectId).toBe(projectId);
    await authorizeWorkspaceUpload("submission_client", projectId);
    const binaryId = randomUUID();
    await reserveWorkspaceUpload("submission_client", { id: binaryId, projectId, mimeType: "application/pdf", byteSize: 12, checksumSha256: "b".repeat(64), objectKey: `private/test/${binaryId}` });
    expect((await finalizeWorkspaceUpload("submission_client", projectId, binaryId, "b".repeat(64))).status).toBe("ready");
    await expect(authorizeWorkspaceUpload("outsider", projectId)).rejects.toMatchObject({ status: 403 });
    await expect(createAssetUploadSession("outsider", { projectId, idempotencyKey: randomUUID(), fileName: "brand.png", mimeType: "image/png", byteSize: 10, checksumSha256: "a".repeat(64) })).rejects.toMatchObject({ status: 403 });
    await postgres.query("DELETE FROM project_members WHERE clerk_user_id='submission_client'");
    await expect(authorizeWorkspaceUpload("submission_client", projectId)).rejects.toMatchObject({ status: 403 });
    await expect(readOwnedImageUpload("submission_client", image.id)).rejects.toMatchObject({ status: 403 });
    expect((await post(body)).status).toBe(403);
  });
  it("requires distinct client and designated creator accounts", async () => {
    identity.subject = "demo_creator";
    expect((await post()).status).toBe(403);
    expect((await postgres.query("SELECT id FROM projects")).rows).toHaveLength(0);
  });
  it("acknowledges exact retries after creator configuration changes without assigning another user", async () => {
    const body = input(); await post(body);
    vi.stubEnv("DEMO_CREATOR_CLERK_ID", ""); identity.fail = true;
    expect((await post(body)).status).toBe(201);
    expect((await postgres.query("SELECT clerk_user_id FROM project_members WHERE role='editor'")).rows).toEqual([{ clerk_user_id: "demo_creator" }]);
  });
  it("does not reveal a saved submission after the actor loses persisted project access", async () => {
    const body = input(); await post(body);
    await postgres.query("DELETE FROM project_members WHERE clerk_user_id='submission_client'");
    await postgres.query("DELETE FROM workspace_members WHERE clerk_user_id='submission_client'");
    expect((await post(body)).status).toBe(403);
  });
  it("requires configured active real creator and keeps provider details private", async () => {
    vi.stubEnv("DEMO_CREATOR_CLERK_ID", "");
    expect((await post()).status).toBe(503);
    vi.stubEnv("DEMO_CREATOR_CLERK_ID", "demo_creator");
    identity.creator.banned = true;
    expect((await post()).status).toBe(503);
    identity.creator.banned = false;
    identity.creator.locked = true;
    expect((await post()).status).toBe(503);
    identity.creator.locked = false;
    identity.creator.id = "different";
    expect((await post()).status).toBe(503);
    identity.creator.id = "demo_creator";
    identity.fail = true;
    const result = await post();
    expect(result.status).toBe(503);
    expect(await result.text()).not.toContain("secret provider detail");
    expect((await postgres.query("SELECT id FROM projects")).rows).toHaveLength(0);
  });
  it("checks auth, Origin, transport limits and rejects browser role or creator claims", async () => {
    identity.subject = null;
    expect((await post()).status).toBe(401);
    identity.subject = "submission_client";
    expect((await POST(request(input(), null))).status).toBe(403);
    expect((await POST(request(input(), "https://evil.test"))).status).toBe(403);
    const bearer = request(input());
    bearer.headers.set("authorization", "Bearer fake");
    expect((await POST(bearer)).status).toBe(401);
    for (const extra of [
      { creatorId: "other" },
      { role: "creator" },
      { name: " " },
      { deadline: "not-date" },
      { contentType: "unknown" },
    ])
      expect((await POST(request({ ...input(), ...extra }))).status).toBe(400);
    const oversized = request({ ...input(), description: "x".repeat(33000) });
    expect((await POST(oversized)).status).toBe(413);
    expect((await postgres.query("SELECT id FROM projects")).rows).toHaveLength(0);
  });
  it("rolls back project, memberships, workspace and budget when brief creation fails", async () => {
    await postgres.exec(
      "CREATE FUNCTION reject_submission() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'private detail'; END $$; CREATE TRIGGER reject_submission BEFORE INSERT ON brief_versions FOR EACH ROW EXECUTE FUNCTION reject_submission();",
    );
    try {
      const response = await post();
      expect(response.status).toBe(503);
      expect(await response.text()).not.toContain("private detail");
      for (const table of ["projects", "project_members", "workspaces", "rate_limit_buckets"])
        expect((await postgres.query(`SELECT * FROM ${table}`)).rows).toHaveLength(0);
    } finally {
      await postgres.exec(
        "DROP TRIGGER reject_submission ON brief_versions; DROP FUNCTION reject_submission()",
      );
    }
  });
});
