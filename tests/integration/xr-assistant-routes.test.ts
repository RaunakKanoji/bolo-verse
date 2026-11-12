import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const identity = vi.hoisted(() => ({ subject: "user_owner" as string | null }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: identity.subject }) }));
vi.mock("@/server/db/client", () => ({
  withDatabase: <T>(operation: (db: typeof database) => Promise<T>) => operation(database),
}));
import * as schema from "@/server/db/schema";
import { bootstrapPersonalWorkspace } from "@/server/db/projects";
import { consumeAssistantBudget } from "@/server/xr-assistant/service";
import * as assistant from "@/app/api/xr/assistant/[projectId]/route";
import { POST as transcribe } from "@/app/api/xr/assistant/[projectId]/transcribe/route";
import { POST as speak } from "@/app/api/xr/assistant/[projectId]/speak/route";

const postgres = new PGlite();
const database = drizzle(postgres, { schema });
const owner = "user_owner";
const projectId = "a0000000-0000-4000-8000-000000000001";
const otherProjectId = "a0000000-0000-4000-8000-000000000002";
const assetId = "b0000000-0000-4000-8000-000000000001";
const foreignAssetId = "b0000000-0000-4000-8000-000000000002";
const context = { params: Promise.resolve({ projectId }) };
const fetcher = vi.fn<typeof fetch>();
const wave = Uint8Array.from([
  82, 73, 70, 70, 36, 0, 0, 0, 87, 65, 86, 69, 102, 109, 116, 32, 16, 0, 0, 0,
]);
const generated = (commands: unknown[] = [], reply = "Try an honest craft story.") =>
  Response.json({
    candidates: [
      { finishReason: "STOP", content: { parts: [{ text: JSON.stringify({ reply, commands }) }] } },
    ],
  });
const request = (
  body: unknown = { message: "Suggest a story", language: "en-IN" },
  origin = "http://localhost:3000",
) =>
  new Request(`http://localhost:3000/api/xr/assistant/${projectId}`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

beforeAll(async () => {
  const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8")) as {
    entries: { tag: string }[];
  };
  for (const { tag } of journal.entries)
    await postgres.exec(await readFile(`drizzle/${tag}.sql`, "utf8"));
}, 30_000);
beforeEach(async () => {
  identity.subject = owner;
  fetcher.mockReset();
  fetcher.mockImplementation(async () => generated());
  vi.stubGlobal("fetch", fetcher);
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_configured");
  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_configured");
  vi.stubEnv("DATABASE_URL", "postgres://test");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
  vi.stubEnv("ALLOWED_ORIGINS", "http://localhost:3000");
  vi.stubEnv("APP_MODE", "live");
  vi.stubEnv("GEMINI_API_KEY", "private-gemini-key");
  vi.stubEnv("GEMINI_MODEL", "configured-model");
  vi.stubEnv("SARVAM_API_KEY", "private-sarvam-key");
  vi.stubEnv("SARVAM_STT_MODEL", "saaras:v4");
  vi.stubEnv("SARVAM_TTS_MODEL", "bulbul:v3");
  vi.stubEnv("SARVAM_TTS_SPEAKER_EN", "shubh");
  vi.stubEnv("SARVAM_TTS_SPEAKER_HI", "shubh");
  vi.stubEnv("SARVAM_TTS_SPEAKER_KN", "shubh");
  await postgres.exec("TRUNCATE workspaces, rate_limit_buckets CASCADE");
  const mine = await bootstrapPersonalWorkspace(database, owner);
  const theirs = await bootstrapPersonalWorkspace(database, "user_outsider");
  await database.insert(schema.projects).values([
    {
      id: projectId,
      workspaceId: mine.id,
      name: "My project",
      objective: "Show authorized handwoven work",
      createdByClerkId: owner,
    },
    {
      id: otherProjectId,
      workspaceId: theirs.id,
      name: "Private competitor",
      objective: "Foreign private secret",
      createdByClerkId: "user_outsider",
    },
  ]);
  await database.insert(schema.projectMembers).values([
    { projectId, clerkUserId: "user_editor", role: "editor" },
    { projectId, clerkUserId: "user_client", role: "client" },
  ]);
  await database.insert(schema.assets).values([
    {
      id: assetId,
      projectId,
      ownerClerkId: owner,
      objectKey: "private/authorized.jpg",
      mimeType: "image/jpeg",
      byteSize: 100,
      status: "ready",
    },
    {
      id: foreignAssetId,
      projectId: otherProjectId,
      ownerClerkId: "user_outsider",
      objectKey: "private/foreign.jpg",
      mimeType: "image/jpeg",
      byteSize: 100,
      status: "ready",
    },
  ]);
});
afterAll(async () => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  await postgres.close();
});

describe("authorized assistant routes with real PostgreSQL context and budgets", () => {
  it("returns safe readiness without contacting a provider or exposing credentials", async () => {
    const response = await assistant.GET(new Request("http://localhost"), context);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(body.data).toMatchObject({
      mode: "live",
      textAvailable: true,
      sttAvailable: true,
      ttsAvailable: true,
    });
    expect(JSON.stringify(body)).not.toContain("private-gemini-key");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each(["user_client", "user_outsider"])(
    "rejects %s before any provider call",
    async (subject) => {
      identity.subject = subject;
      expect((await assistant.POST(request(), context)).status).toBe(403);
      expect(fetcher).not.toHaveBeenCalled();
    },
  );
  it("rejects signed-out and unconfigured authentication without a demo bypass", async () => {
    identity.subject = null;
    vi.stubEnv("APP_MODE", "demo");
    expect((await assistant.POST(request(), context)).status).toBe(401);
    vi.stubEnv("CLERK_SECRET_KEY", "");
    expect((await assistant.POST(request(), context)).status).toBe(503);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("rejects foreign origins, invalid IDs, extra fields and oversized text", async () => {
    expect(
      (await assistant.POST(request(undefined, "https://attacker.test"), context)).status,
    ).toBe(403);
    expect(
      (await assistant.POST(request(), { params: Promise.resolve({ projectId: "invalid" }) }))
        .status,
    ).toBe(400);
    expect(
      (
        await assistant.POST(
          request({ message: "Help", language: "en-IN", projectId: otherProjectId }),
          context,
        )
      ).status,
    ).toBe(400);
    expect(
      (await assistant.POST(request({ message: "x".repeat(2001), language: "en-IN" }), context))
        .status,
    ).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("sends only authorized project context and returns validated proposals, not executed mutations", async () => {
    identity.subject = "user_editor";
    fetcher.mockImplementation(async () =>
      generated([{ type: "OPEN_ASSET", assetId }, { type: "RESET_WORKSPACE" }]),
    );
    const response = await assistant.POST(request(), context);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({
      mode: "live",
      commands: [{ type: "OPEN_ASSET", assetId }, { type: "RESET_WORKSPACE" }],
    });
    const providerBody = String(fetcher.mock.calls[0][1]?.body);
    expect(providerBody).toContain("Show authorized handwoven work");
    expect(providerBody).not.toContain("Foreign private secret");
    expect(providerBody).not.toContain("private/authorized.jpg");
    expect((await postgres.query("SELECT id FROM xr_workspaces")).rows).toHaveLength(0);
  });
  it("rejects model attempts to target another project's assets", async () => {
    fetcher.mockImplementation(async () =>
      generated([{ type: "OPEN_ASSET", assetId: foreignAssetId }]),
    );
    const response = await assistant.POST(request(), context);
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain(foreignAssetId);
  });
  it("rechecks access after a provider call before releasing its response", async () => {
    identity.subject = "user_editor";
    fetcher.mockImplementation(async () => {
      await postgres.query("DELETE FROM project_members WHERE clerk_user_id = $1", ["user_editor"]);
      return generated();
    });
    expect((await assistant.POST(request(), context)).status).toBe(403);
  });
  it("atomically enforces a shared twenty-request budget under concurrency", async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 21 }, () => consumeAssistantBudget(owner)),
    );
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(20);
    const rejected = results.find(
      (result) => result.status === "rejected",
    ) as PromiseRejectedResult;
    expect(rejected.reason).toMatchObject({ status: 429 });
    expect((await assistant.POST(request(), context)).status).toBe(429);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("fails closed without Gemini and does not spend the request budget", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    expect((await assistant.POST(request(), context)).status).toBe(503);
    expect((await postgres.query("SELECT key_hash FROM rate_limit_buckets")).rows).toHaveLength(0);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("explicitly labels the opt-in development mock and still requires a real authorized project", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("APP_MODE", "demo");
    const response = await assistant.POST(request(), context);
    expect(response.status).toBe(200);
    expect((await response.json()).data).toMatchObject({ mode: "development-mock", commands: [] });
    expect(fetcher).not.toHaveBeenCalled();
    expect(
      (await assistant.POST(request(), { params: Promise.resolve({ projectId: otherProjectId }) }))
        .status,
    ).toBe(403);
  });
  it("transcribes explicit bounded voice input and exposes no raw audio in its response", async () => {
    fetcher.mockImplementation(async () =>
      Response.json({ transcript: "Focus on the project", language_code: "en-IN" }),
    );
    const audio = new Request("http://localhost:3000/transcribe", {
      method: "POST",
      headers: {
        Origin: "http://localhost:3000",
        "Content-Type": "audio/wav",
        "X-Speech-Language": "en-IN",
        "X-Speech-Consent": "xr-voice-v1",
      },
      body: wave.buffer,
    });
    const response = await transcribe(audio, context);
    expect(response.status).toBe(200);
    expect((await response.json()).data).toEqual({
      text: "Focus on the project",
      language: "en-IN",
      mode: "live",
    });
  });
  it("prepares bounded WAV playback with no-store headers", async () => {
    fetcher.mockImplementation(async () =>
      Response.json({ audios: [Buffer.from(wave).toString("base64")] }),
    );
    const response = await speak(
      request({ text: "Your campaign goal", language: "en-IN" }),
      context,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("audio/wav");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(wave);
  });
});
