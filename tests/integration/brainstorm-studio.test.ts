import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const identity = vi.hoisted(() => ({ subject: "studio_owner" as string | null }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: identity.subject }) }));
vi.mock("@/server/db/client", () => ({
  withDatabase: <T>(fn: (db: typeof database) => Promise<T>) => fn(database),
}));
import * as schema from "@/server/db/schema";
import { brainstormMessages } from "@/server/db/brainstorm-schema";
import { bootstrapPersonalWorkspace } from "@/server/db/projects";
import {
  createBrainstormSession,
  readBrainstormSession,
  listBrainstormSessions,
  updateBrainstormSession,
  saveBrainstormIdea,
} from "@/server/db/brainstorm-studio";
import { GET as getSession } from "@/app/api/v1/brainstorm/sessions/[sessionId]/route";
import { POST as postSession } from "@/app/api/v1/brainstorm/sessions/route";
import { POST as transcribe } from "@/app/api/v1/brainstorm/sessions/[sessionId]/transcribe/route";
import { sendBrainstormMessage } from "@/server/services/brainstorm-studio";
const pg = new PGlite();
const database = drizzle(pg, { schema });
const owner = "studio_owner",
  other = "studio_other";
const projectId = "a3000000-0000-4000-8000-000000000001";
const content = {
  reply: "Three grounded directions",
  concepts: [
    {
      title: "Craft",
      targetAudience: "Shoppers",
      coreMessage: "Care",
      contentFormat: "Video",
      creativeDirection: "Warm",
      productionRequirements: ["Camera"],
      nextSteps: ["Shot list"],
    },
  ],
};
const fetcher = vi.fn<typeof fetch>();
beforeAll(async () => {
  const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8"));
  for (const { tag } of journal.entries)
    await pg.exec(await readFile(`drizzle/${tag}.sql`, "utf8"));
}, 30000);
beforeEach(async () => {
  identity.subject = owner;
  await pg.exec("TRUNCATE workspaces,rate_limit_buckets CASCADE");
  for (const [k, v] of Object.entries({
    DATABASE_URL: "postgres://test",
    CLERK_SECRET_KEY: "sk_test_configured",
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_configured",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    ALLOWED_ORIGINS: "http://localhost:3000",
    GEMINI_API_KEY: "private-gemini-key",
    GEMINI_MODEL: "configured-model",
    APP_MODE: "live",
  }))
    vi.stubEnv(k, v);
  fetcher.mockReset();
  fetcher.mockResolvedValue(
    Response.json({
      candidates: [
        { finishReason: "STOP", content: { parts: [{ text: JSON.stringify(content) }] } },
      ],
    }),
  );
  vi.stubGlobal("fetch", fetcher);
});
afterAll(async () => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  await pg.close();
});
const create = () =>
  createBrainstormSession(owner, { idempotencyKey: randomUUID(), title: "Launch" });
describe("persistent actor-private brainstorm", () => {
  it("persists exact session retries and hides all content from another actor", async () => {
    const input = { idempotencyKey: randomUUID(), title: "Launch" };
    const a = await createBrainstormSession(owner, input);
    expect(await createBrainstormSession(owner, input)).toEqual(a);
    expect((await listBrainstormSessions(owner)).sessions).toHaveLength(1);
    expect((await listBrainstormSessions(other)).sessions).toHaveLength(0);
    await expect(readBrainstormSession(other, a.id)).rejects.toMatchObject({ status: 403 });
    await expect(createBrainstormSession(other, input)).rejects.toMatchObject({ status: 409 });
    await expect(
      createBrainstormSession(owner, { ...input, title: "Changed" }),
    ).rejects.toMatchObject({ status: 409 });
  });
  it("enforces revision CAS, durable metadata retry and bounded idea provenance", async () => {
    const a = await create();
    const input = { expectedRevision: 0, idempotencyKey: randomUUID(), pinned: true };
    expect((await updateBrainstormSession(owner, a.id, input)).revision).toBe(1);
    expect((await updateBrainstormSession(owner, a.id, input)).revision).toBe(1);
    await expect(
      updateBrainstormSession(owner, a.id, { ...input, idempotencyKey: randomUUID() }),
    ).rejects.toMatchObject({ status: 409 });
    const idea = {
      idempotencyKey: randomUUID(),
      expectedRevision: 1,
      title: "Direction",
      description: "Warm light",
      tags: ["video"],
      category: "concept" as const,
    };
    const saved = await saveBrainstormIdea(owner, a.id, idea);
    expect(saved.session.revision).toBe(2);
    expect((await saveBrainstormIdea(owner, a.id, idea)).idea.id).toBe(saved.idea.id);
    await expect(
      saveBrainstormIdea(other, a.id, {
        ...idea,
        idempotencyKey: randomUUID(),
        expectedRevision: 2,
      }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      saveBrainstormIdea(owner, a.id, {
        ...idea,
        idempotencyKey: randomUUID(),
        expectedRevision: 2,
        sourceMessageId: randomUUID(),
      }),
    ).rejects.toMatchObject({ status: 400 });
    expect((await readBrainstormSession(owner, a.id)).ideas).toHaveLength(1);
  });
  it("stores one real validated response and never dispatches an exact billed retry", async () => {
    const a = await create();
    const input = {
      idempotencyKey: randomUUID(),
      expectedRevision: 0,
      message: "Help token=private https://private.test",
    };
    const result = await sendBrainstormMessage(owner, a.id, input);
    expect(result.message).toMatchObject({ status: "completed", content });
    expect((await readBrainstormSession(owner, a.id)).messages).toHaveLength(1);
    await sendBrainstormMessage(owner, a.id, input);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const body = String(fetcher.mock.calls[0][1]?.body);
    expect(body).not.toContain("token=private");
    expect(body).not.toContain("studio_owner");
    expect(body).not.toContain("private.test");
  });
  it("does not redispatch an ambiguous billed failure or leak provider errors", async () => {
    const a = await create();
    fetcher.mockRejectedValue(new TypeError("private-key timeout"));
    const input = { idempotencyKey: randomUUID(), expectedRevision: 0, message: "Help" };
    await expect(sendBrainstormMessage(owner, a.id, input)).rejects.toMatchObject({ status: 503 });
    const retry = await sendBrainstormMessage(owner, a.id, input);
    expect(retry.message.status).toBe("uncertain");
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect((await database.select().from(brainstormMessages))[0].content).toBeNull();
  });
  it("grounds follow-up requests in bounded saved ideas without leaking links or credentials", async () => {
    const a = await create();
    const saved = await saveBrainstormIdea(owner, a.id, {
      idempotencyKey: randomUUID(), expectedRevision: 0,
      title: "Chosen cold brew launch", category: "concept", tags: ["social"],
      description: "Show the morning commute. token=private https://private.test " + "x".repeat(2000),
    });
    await sendBrainstormMessage(owner, a.id, {
      idempotencyKey: randomUUID(), expectedRevision: saved.session.revision,
      message: "Refine the selected concept",
    });
    const body = JSON.parse(String(fetcher.mock.calls[0][1]?.body));
    const context = JSON.parse(body.contents[0].parts[0].text);
    expect(context.savedIdeas).toHaveLength(1);
    expect(context.savedIdeas[0]).toMatchObject({title: "Chosen cold brew launch", category: "concept", tags: ["social"]});
    expect(context.savedIdeas[0].description.length).toBeLessThanOrEqual(1000);
    expect(JSON.stringify(context)).not.toMatch(/token=private|private\.test|studio_owner|ownerClerkId/);
    expect(context).toHaveProperty("assetAnalysis", "No uploaded documents or media were analyzed.");
  });
  it("redacts complete secrets before bounding saved idea excerpts", async () => {
    const a = await create();
    await saveBrainstormIdea(owner, a.id, {
      idempotencyKey: randomUUID(), expectedRevision: 0, title: "Private reference",
      description: "-----BEGIN PRIVATE KEY-----\n" + "A".repeat(1500) + "\n-----END PRIVATE KEY-----",
      tags: [], category: "idea",
    });
    await sendBrainstormMessage(owner, a.id, {
      idempotencyKey: randomUUID(), expectedRevision: 1, message: "Help with the saved idea",
    });
    expect(String(fetcher.mock.calls[0][1]?.body)).not.toContain("BEGIN PRIVATE KEY");
    expect(String(fetcher.mock.calls[0][1]?.body)).not.toContain("A".repeat(100));
  });
  it("discards AI output when saved context changes during provider latency", async () => {
    const a = await create();
    fetcher.mockImplementation(async () => {
      const current = await readBrainstormSession(owner, a.id);
      await saveBrainstormIdea(owner, a.id, {
        idempotencyKey: randomUUID(), expectedRevision: current.session.revision,
        title: "A newer decision", description: "Use a different product direction", tags: [], category: "direction",
      });
      return Response.json({candidates: [{finishReason: "STOP", content: {parts: [{text: JSON.stringify(content)}]}}]});
    });
    await expect(sendBrainstormMessage(owner, a.id, {
      idempotencyKey: randomUUID(), expectedRevision: 0, message: "Use the saved direction",
    })).rejects.toMatchObject({status: 409});
    expect((await readBrainstormSession(owner, a.id)).messages[0]).toMatchObject({status: "uncertain", content: null});
  });
  it("reauthorizes linked sessions after provider latency and discards a revoked response", async () => {
    const workspace = await bootstrapPersonalWorkspace(database, other);
    await database.insert(schema.projects).values({
      id: projectId,
      workspaceId: workspace.id,
      name: "Private",
      objective: "Private objective",
      createdByClerkId: other,
    });
    await database
      .insert(schema.projectMembers)
      .values({ projectId, clerkUserId: owner, role: "editor" });
    const a = await createBrainstormSession(owner, {
      idempotencyKey: randomUUID(),
      title: "Linked",
      projectId,
    });
    fetcher.mockImplementation(async () => {
      await database
        .delete(schema.projectMembers)
        .where(eq(schema.projectMembers.clerkUserId, owner));
      return Response.json({
        candidates: [
          { finishReason: "STOP", content: { parts: [{ text: JSON.stringify(content) }] } },
        ],
      });
    });
    await expect(
      sendBrainstormMessage(owner, a.id, {
        idempotencyKey: randomUUID(),
        expectedRevision: 0,
        message: "Help",
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect((await database.select().from(brainstormMessages))[0].content).toBeNull();
    await expect(readBrainstormSession(owner, a.id)).rejects.toMatchObject({ status: 403 });
  });
  it("rejects unconfigured AI before reserving a provider attempt and keeps independent ideas usable", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const a = await create();
    await expect(
      sendBrainstormMessage(owner, a.id, {
        idempotencyKey: randomUUID(),
        expectedRevision: 0,
        message: "Help",
      }),
    ).rejects.toMatchObject({ status: 503 });
    expect((await readBrainstormSession(owner, a.id)).messages).toHaveLength(0);
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("brainstorm route boundaries", () => {
  const request = (body: unknown, origin = "http://localhost:3000") =>
    new Request("http://localhost:3000/api/v1/brainstorm/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify(body),
    });
  it("requires identity and trusted Origin before accepting strict mutation data", async () => {
    identity.subject = null;
    expect(
      (await postSession(request({ idempotencyKey: randomUUID(), title: "Launch" }))).status,
    ).toBe(401);
    identity.subject = owner;
    expect(
      (
        await postSession(
          request({ idempotencyKey: randomUUID(), title: "Launch" }, "https://foreign.test"),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await postSession(
          request({ idempotencyKey: randomUUID(), title: "Launch", ownerClerkId: other }),
        )
      ).status,
    ).toBe(400);
    const a = await create();
    identity.subject = other;
    const response = await getSession(new Request("http://localhost:3000/private"), {
      params: Promise.resolve({ sessionId: a.id }),
    });
    expect(response.status).toBe(403);
    expect(JSON.stringify(await response.json())).not.toContain("studio_owner");
  });
  it("keeps raw speech transient and returns a transcript without executing a command", async () => {
    vi.stubEnv("SARVAM_API_KEY", "private-speech-key");
    vi.stubEnv("SARVAM_STT_MODEL", "saaras:v3");
    const a = await create();
    fetcher.mockResolvedValue(
      Response.json({ transcript: "Reset the scene", language_code: "en-IN" }),
    );
    const bytes = new Uint8Array(32);
    bytes.set([0x1a, 0x45, 0xdf, 0xa3]);
    const response = await transcribe(
      new Request("http://localhost:3000/voice", {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
          "Content-Type": "audio/webm",
          "x-speech-consent": "xr-voice-v1",
          "x-speech-language": "en-IN",
        },
        body: bytes,
      }),
      { params: Promise.resolve({ sessionId: a.id }) },
    );
    expect(response.status).toBe(200);
    expect((await response.json()).data).toEqual({
      text: "Reset the scene",
      language: "en-IN",
      mode: "live",
    });
    expect((await readBrainstormSession(owner, a.id)).messages).toHaveLength(0);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

describe("ambiguous attempt recovery", () => {
  it("allows an explicit new attempt after an abandoned pending dispatch without repeating it", async () => {
    const a = await create();
    const abandoned = randomUUID();
    await database
      .insert(brainstormMessages)
      .values({
        id: abandoned,
        sessionId: a.id,
        message: "Earlier message",
        requestHash: "abandoned",
        status: "pending",
        createdAt: new Date(Date.now() - 180000),
      });
    const result = await sendBrainstormMessage(owner, a.id, {
      idempotencyKey: randomUUID(),
      expectedRevision: 0,
      message: "New reviewed attempt",
    });
    expect(result.message.status).toBe("completed");
    expect(
      (
        await database.select().from(brainstormMessages).where(eq(brainstormMessages.id, abandoned))
      )[0].status,
    ).toBe("uncertain");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
