import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, afterAll, describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
const auth = vi.hoisted(() => ({ subject: "workspace_owner" as string | null }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: auth.subject }) }));
vi.mock("@/server/db/client", () => ({
  withDatabase: <T>(fn: (database: typeof db) => Promise<T>) => fn(db),
}));
import * as schema from "@/server/db/schema";
import { brainstormIdeas, brainstormSessions } from "@/server/db/brainstorm-schema";
import { createStudioClient, listStudioClients } from "@/server/db/workspace";
import { bootstrapPersonalWorkspace } from "@/server/db/projects";
import { GET as LIST, POST as CREATE } from "@/app/api/v1/workspace/projects/route";
import { GET as DETAIL, PATCH as UPDATE } from "@/app/api/v1/workspace/projects/[projectId]/route";
import { POST as DUPLICATE } from "@/app/api/v1/workspace/projects/[projectId]/duplicate/route";
import { POST as TASK } from "@/app/api/v1/workspace/projects/[projectId]/tasks/route";
import { PATCH as UPDATE_TASK } from "@/app/api/v1/workspace/projects/[projectId]/tasks/[taskId]/route";
import { GET as CLIENTS, POST as CLIENT } from "@/app/api/v1/workspace/clients/route";
import { GET as LIBRARY } from "@/app/api/v1/workspace/assets/route";
import { PATCH as ASSET } from "@/app/api/v1/workspace/assets/[assetId]/route";
import { GET as OVERVIEW } from "@/app/api/v1/workspace/overview/route";
import { PATCH as LEGACY } from "@/app/api/v1/projects/[projectId]/route";
const pg = new PGlite(),
  db = drizzle(pg, { schema });
const owner = "workspace_owner",
  editor = "workspace_editor",
  outsider = "workspace_outsider",
  client = "workspace_client";
const id = "c3000000-0000-4000-8000-000000000001",
  foreignId = "c3000000-0000-4000-8000-000000000002",
  assetId = "c3000000-0000-4000-8000-000000000003";
const ctx = (projectId = id) => ({ params: Promise.resolve({ projectId }) });
const read = (query = "") => new Request(`http://localhost:3000/api/v1/workspace/projects${query}`);
const write = (input: unknown, origin = "http://localhost:3000") =>
  new Request("http://localhost:3000/api/v1/workspace", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(input),
  });
const data = async (r: Response) => (await r.json()).data;
const create = (extra = {}) => ({
  idempotencyKey: randomUUID(),
  name: "Launch",
  objective: "Introduce the range",
  ...extra,
});
beforeAll(async () => {
  const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8"));
  for (const { tag } of journal.entries)
    await pg.exec(await readFile(`drizzle/${tag}.sql`, "utf8"));
}, 30000);
beforeEach(async () => {
  auth.subject = owner;
  for (const [k, v] of Object.entries({
    CLERK_SECRET_KEY: "sk_test_configured",
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_configured",
    DATABASE_URL: "postgres://test",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    ALLOWED_ORIGINS: "http://localhost:3000",
  }))
    vi.stubEnv(k, v);
  await pg.exec("TRUNCATE workspaces,rate_limit_buckets CASCADE");
  const workspace = await bootstrapPersonalWorkspace(db, owner),
    other = await bootstrapPersonalWorkspace(db, outsider);
  await db.insert(schema.projects).values([
    {
      id,
      workspaceId: workspace.id,
      name: "Existing campaign",
      objective: "Launch",
      createdByClerkId: owner,
    },
    {
      id: foreignId,
      workspaceId: other.id,
      name: "Secret campaign",
      objective: "Private",
      createdByClerkId: outsider,
    },
  ]);
  await db.insert(schema.projectMembers).values([
    { projectId: id, clerkUserId: editor, role: "editor" },
    { projectId: id, clerkUserId: client, role: "client" },
  ]);
  await db.insert(schema.assets).values({
    id: assetId,
    projectId: id,
    ownerClerkId: owner,
    objectKey: "private/secret.png",
    mimeType: "image/png",
    byteSize: 8,
    status: "ready",
  });
});
afterAll(async () => {
  await pg.close();
  vi.unstubAllEnvs();
});
describe("creator workspace real SQL API", () => {
  it("derives production version activity and only the actor's saved concepts from persisted rows", async () => {
    const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, id));
    const ownSession = randomUUID(), otherSession = randomUUID();
    await db.insert(brainstormSessions).values([
      {id: ownSession, workspaceId: project.workspaceId, projectId: id, ownerClerkId: owner, title: "Private session", createHash: "a"},
      {id: otherSession, workspaceId: project.workspaceId, projectId: id, ownerClerkId: editor, title: "Other actor", createHash: "b"},
    ]);
    const ownIdea = randomUUID(), otherIdea = randomUUID(), noteId = randomUUID();
    await db.insert(brainstormIdeas).values([
      {id: ownIdea, sessionId: ownSession, requestHash: "a", title: "Own idea", description: "Draft", tags: [], category: "idea"},
      {id: otherIdea, sessionId: otherSession, requestHash: "b", title: "Private other idea", description: "Private", tags: [], category: "idea"},
    ]);
    await db.insert(schema.artifactVersions).values({id: noteId, projectId: id, kind: "note", version: 1, payload: {kind: "note", schemaVersion: 1, text: "Production notes"}, authorClerkId: owner});
    const overview = await data(await OVERVIEW(read()));
    expect(overview.activity).toEqual(expect.arrayContaining([
      expect.objectContaining({kind: "artifact_saved", title: "note saved · version 1"}),
      expect.objectContaining({kind: "concept_saved", title: "Concept saved"}),
    ]));
    const serialized = JSON.stringify(overview.activity);
    expect(serialized).toContain(ownIdea);
    expect(serialized).not.toContain(otherIdea);
    expect(serialized).not.toContain("Private other idea");
    auth.subject = client;
    expect((await data(await OVERVIEW(read()))).activity).toEqual([]);
  });
  it("creates a scoped contact with truthful counts", async () => {
    const contact = await createStudioClient(owner, {
      idempotencyKey: randomUUID(),
      name: "Contact",
      organization: "",
      email: "",
      phone: "",
      notes: "",
    });
    expect(contact).toMatchObject({ activeProjects: 0, pendingReviews: 0, lastActivityAt: null });
    expect(
      (await listStudioClients(owner, { limit: 50, offset: 0, sort: "updated" })).clients,
    ).toEqual([contact]);
  });
  it("creates rich reusable projects idempotently and rejects changed retries", async () => {
    const body = create({ type: "Video Production", priority: "high", dueDate: "2026-12-20" });
    const first = await CREATE(write(body));
    expect(first.status).toBe(201);
    const project = (await data(first)).project;
    expect(project).toMatchObject({
      id: body.idempotencyKey,
      type: "Video Production",
      priority: "high",
      revision: 1,
      progress: null,
      canEdit: true,
    });
    expect(await data(await CREATE(write(body)))).toEqual({ project });
    expect((await CREATE(write({ ...body, name: "Changed" }))).status).toBe(409);
    expect((await pg.query("SELECT id FROM projects")).rows).toHaveLength(3);
  });
  it("preserves CAS across old and new APIs, archive is reversible and filters are actual", async () => {
    expect((await UPDATE(write({ expectedRevision: 1, status: "archived" }), ctx())).status).toBe(
      200,
    );
    expect((await data(await LIST(read("?status=active")))).projects).toHaveLength(0);
    expect((await UPDATE(write({ expectedRevision: 1, name: "stale" }), ctx())).status).toBe(409);
    expect((await LEGACY(write({ name: "Legacy name" }), ctx())).status).toBe(200);
    expect((await UPDATE(write({ expectedRevision: 2, status: "active" }), ctx())).status).toBe(
      409,
    );
    expect((await UPDATE(write({ expectedRevision: 3, status: "active" }), ctx())).status).toBe(
      200,
    );
    expect((await data(await LIST(read("?search=Legacy&sort=name&limit=1")))).total).toBe(1);
  });
  it("enforces editor/readonly/foreign scopes without broadening review membership", async () => {
    auth.subject = editor;
    expect((await UPDATE(write({ expectedRevision: 1, name: "Editor" }), ctx())).status).toBe(200);
    auth.subject = client;
    expect((await DETAIL(read(), ctx())).status).toBe(200);
    expect((await data(await DETAIL(read(), ctx()))).canEdit).toBe(false);
    expect((await UPDATE(write({ expectedRevision: 2, name: "Denied" }), ctx())).status).toBe(403);
    expect((await CLIENTS(read())).status).toBe(200);
    expect((await data(await CLIENTS(read()))).clients).toEqual([]);
    auth.subject = outsider;
    expect((await DETAIL(read(), ctx())).status).toBe(403);
    expect((await UPDATE(write({ expectedRevision: 2, name: "Denied" }), ctx())).status).toBe(403);
  });
  it("does not attach foreign clients and duplicates only project planning metadata", async () => {
    auth.subject = outsider;
    const foreign = (
      await data(
        await CLIENT(
          write({
            idempotencyKey: randomUUID(),
            name: "Private contact",
            email: "private@example.test",
          }),
        ),
      )
    ).client;
    auth.subject = owner;
    expect((await UPDATE(write({ expectedRevision: 1, clientId: foreign.id }), ctx())).status).toBe(
      403,
    );
    const body = { idempotencyKey: randomUUID() };
    const clone = await DUPLICATE(write(body), ctx());
    expect(clone.status).toBe(201);
    expect((await data(clone)).project.name).toBe("Existing campaign (copy)");
    expect((await DUPLICATE(write(body), ctx())).status).toBe(201);
    expect((await pg.query("SELECT * FROM assets")).rows).toHaveLength(1);
    expect((await pg.query("SELECT * FROM access_grants")).rows).toHaveLength(0);
  });
  it("keeps duplicate retries stable after the source project changes", async () => {
    const body = { idempotencyKey: randomUUID() };
    const first = await data(await DUPLICATE(write(body), ctx()));
    expect(
      (await UPDATE(write({ expectedRevision: 1, name: "Renamed source" }), ctx())).status,
    ).toBe(200);
    const retry = await DUPLICATE(write(body), ctx());
    expect(retry.status).toBe(201);
    expect(await data(retry)).toEqual(first);
  });
  it("scopes linked client counts and protects contact updates with CAS", async () => {
    const contact = (
      await data(
        await CLIENT(
          write({
            idempotencyKey: randomUUID(),
            name: "Studio client",
            email: "client@example.test",
          }),
        ),
      )
    ).client;
    expect((await UPDATE(write({ expectedRevision: 1, clientId: contact.id }), ctx())).status).toBe(
      200,
    );
    const directory = await data(await CLIENTS(read()));
    expect(directory.clients[0]).toMatchObject({
      activeProjects: 1,
      pendingReviews: 0,
      lastActivityAt: expect.any(String),
    });
    auth.subject = editor;
    expect((await data(await CLIENTS(read()))).clients).toEqual([]);
    expect((await data(await DETAIL(read(), ctx()))).project.clientName).toBe("Studio client");
  });
  it("persists tasks with revision checks and derives project progress/overview", async () => {
    const body = { idempotencyKey: randomUUID(), title: "Edit poster", dueDate: "2099-12-20" };
    const task = (await data(await TASK(write(body), ctx()))).task;
    expect(task.status).toBe("todo");
    expect((await TASK(write(body), ctx())).status).toBe(201);
    const taskctx = { params: Promise.resolve({ projectId: id, taskId: task.id }) };
    expect(
      (await UPDATE_TASK(write({ expectedRevision: 1, status: "done" }), taskctx)).status,
    ).toBe(200);
    expect(
      (await UPDATE_TASK(write({ expectedRevision: 1, status: "todo" }), taskctx)).status,
    ).toBe(409);
    expect((await data(await DETAIL(read(), ctx()))).project.progress).toBe(100);
    expect((await data(await OVERVIEW(read()))).metrics).toMatchObject({
      activeProjects: 1,
      pendingReviews: 0,
      completedDeliverables: 0,
    });
    expect(
      (
        await UPDATE_TASK(write({ expectedRevision: 2, status: "todo" }), {
          params: Promise.resolve({ projectId: foreignId, taskId: task.id }),
        })
      ).status,
    ).toBe(403);
  });
  it("archives library metadata without mutating ready bytes or exposing keys", async () => {
    const actx = { params: Promise.resolve({ assetId }) };
    expect(
      (await ASSET(write({ expectedRevision: 0, archived: true, collection: "Campaign" }), actx))
        .status,
    ).toBe(200);
    expect((await data(await LIBRARY(read("?archived=false")))).assets).toEqual([]);
    const list = await data(await LIBRARY(read("?archived=true&collection=Campaign")));
    expect(list.assets).toHaveLength(1);
    expect(JSON.stringify(list)).not.toMatch(/private\/|objectKey|ownerClerkId|checksum/);
    expect((await ASSET(write({ expectedRevision: 0, archived: false }), actx)).status).toBe(409);
    expect((await pg.query("SELECT status,object_key FROM assets")).rows).toEqual([
      { status: "ready", object_key: "private/secret.png" },
    ]);
    auth.subject = outsider;
    expect((await ASSET(write({ expectedRevision: 1, archived: false }), actx)).status).toBe(403);
  });
  it("derives review metrics from active grants and terminal decisions without granting project access", async () => {
    const version = randomUUID(),
      grant = randomUUID();
    await pg.query(
      "INSERT INTO content_versions (id,project_id,version,source_snapshot,asset_id,media_metadata,status,author_clerk_id) VALUES ($1,$2,1,'{}',$3,'{}','ready',$4)",
      [version, id, assetId, owner],
    );
    await db.insert(schema.accessGrants).values({
      id: grant,
      projectId: id,
      scope: "review",
      contentVersionId: version,
      secretHash: "a".repeat(64),
      issuerClerkId: owner,
      reviewerClerkId: "review_only",
      expiresAt: new Date(Date.now() + 86400000),
    });
    expect((await data(await OVERVIEW(read()))).metrics).toMatchObject({
      pendingReviews: 1,
      completedDeliverables: 0,
    });
    auth.subject = "review_only";
    expect((await DETAIL(read(), ctx())).status).toBe(403);
    expect((await data(await LIBRARY(read()))).assets).toEqual([]);
    expect((await data(await OVERVIEW(read()))).metrics.pendingReviews).toBe(0);
    await db.insert(schema.reviewDecisions).values({
      projectId: id,
      contentVersionId: version,
      reviewerClerkId: "review_only",
      reviewGrantId: grant,
      decision: "approved",
    });
    auth.subject = owner;
    const overview = await data(await OVERVIEW(read()));
    expect(overview.metrics).toMatchObject({ pendingReviews: 0, completedDeliverables: 1 });
    expect(overview.activity.some((event: { kind: string }) => event.kind === "approved")).toBe(
      true,
    );
  });
  it("withholds internal dashboard tasks from client memberships", async () => {
    expect(
      (await TASK(write({ idempotencyKey: randomUUID(), title: "Private production task" }), ctx()))
        .status,
    ).toBe(201);
    auth.subject = client;
    const overview = await data(await OVERVIEW(read()));
    expect(overview.tasks).toEqual([]);
  });
  it("rechecks task editability after a role downgrade during project detail loading", async () => {
    await TASK(write({ idempotencyKey: randomUUID(), title: "Private production task" }), ctx());
    auth.subject = editor;
    const execute = pg.query.bind(pg);
    let changed = false;
    const hooked = async (...args: Parameters<typeof pg.query>) => {
      if (!changed && /from "project_tasks"/i.test(args[0])) {
        changed = true;
        await execute(
          "UPDATE project_members SET role='client' WHERE project_id=$1 AND clerk_user_id=$2",
          [id, editor],
        );
      }
      return execute(...args);
    };
    const interceptor = vi.spyOn(pg, "query").mockImplementation(hooked as typeof pg.query);
    try {
      expect((await data(await DETAIL(read(), ctx()))).tasks).toEqual([]);
    } finally {
      interceptor.mockRestore();
    }
  });
  it("rolls back duplication when source edit permission disappears before destination insertion", async () => {
    auth.subject = editor;
    const key = randomUUID();
    const original = pg.transaction.bind(pg);
    const interceptor = vi.spyOn(pg, "transaction").mockImplementation((callback) =>
      original(async (tx) => {
        const execute = tx.query.bind(tx);
        let changed = false;
        const hooked = async (...args: Parameters<typeof tx.query>) => {
          if (!changed && /insert into "projects"/i.test(args[0])) {
            changed = true;
            await execute("DELETE FROM project_members WHERE project_id=$1 AND clerk_user_id=$2", [
              id,
              editor,
            ]);
          }
          return execute(...args);
        };
        vi.spyOn(tx, "query").mockImplementation(hooked as typeof tx.query);
        return callback(tx);
      }),
    );
    try {
      expect((await DUPLICATE(write({ idempotencyKey: key }), ctx())).status).toBe(403);
    } finally {
      interceptor.mockRestore();
    }
    expect((await pg.query("SELECT id FROM projects WHERE id=$1", [key])).rows).toEqual([]);
  });
  it("detaches cross-workspace client metadata when an assigned editor duplicates a project", async () => {
    const contact = (
      await data(
        await CLIENT(
          write({ idempotencyKey: randomUUID(), name: "Private client directory entry" }),
        ),
      )
    ).client;
    expect((await UPDATE(write({ expectedRevision: 1, clientId: contact.id }), ctx())).status).toBe(
      200,
    );
    const ownCopy = await DUPLICATE(write({ idempotencyKey: randomUUID() }), ctx());
    expect(ownCopy.status).toBe(201);
    expect((await data(ownCopy)).project.clientId).toBe(contact.id);
    auth.subject = editor;
    expect(
      (
        await UPDATE(
          write({ expectedRevision: 2, name: "Editor planning update", clientId: contact.id }),
          ctx(),
        )
      ).status,
    ).toBe(200);
    const copy = await DUPLICATE(write({ idempotencyKey: randomUUID() }), ctx());
    expect(copy.status).toBe(201);
    expect((await data(copy)).project).toMatchObject({
      clientId: null,
      clientName: null,
      objective: "Launch",
    });
  });
  it("validates identity, origin, pagination and bounded JSON", async () => {
    expect((await CREATE(write(create(), "https://evil.test"))).status).toBe(403);
    expect((await LIST(read("?limit=101"))).status).toBe(400);
    expect((await CREATE(write({ ...create(), role: "owner" }))).status).toBe(400);
    expect((await CREATE(write({ ...create(), objective: "x".repeat(20000) }))).status).toBe(413);
    auth.subject = null;
    expect((await LIST(read())).status).toBe(401);
  });
});
