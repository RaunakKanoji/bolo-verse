import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { XRCommandSchema, validateAssistantCommands } from "@/lib/contracts/xr-assistant";
import { parseServerEnv } from "@/server/config/env";
import {
  createXRAssistantProvider,
  getXRAssistantReadiness,
} from "@/server/providers/xr-assistant";
import { providerJson } from "@/server/providers/xr-http";

const projectId = "a0000000-0000-4000-8000-000000000001";
const assetId = "b0000000-0000-4000-8000-000000000001";
const context = {
  projectId,
  name: "A campaign",
  objective: "Introduce the collection",
  content: "Approved facts only",
  panelIds: ["project-overview"],
  assetIds: [assetId],
};
afterEach(() => vi.unstubAllEnvs());

describe("restricted XR assistant", () => {
  it("rejects arbitrary tools and command fields", () => {
    expect(XRCommandSchema.safeParse({ type: "EVAL", code: "fetch('/private')" }).success).toBe(
      false,
    );
    expect(XRCommandSchema.safeParse({ type: "RESET_WORKSPACE", projectId }).success).toBe(false);
  });
  it("authorizes every command reference and rejects the entire response on a foreign reference", () => {
    expect(
      validateAssistantCommands(
        [
          { type: "OPEN_ASSET", assetId },
          { type: "FOCUS_PANEL", panelId: "project-overview" },
        ],
        context,
      ),
    ).toHaveLength(2);
    expect(() =>
      validateAssistantCommands(
        [{ type: "OPEN_ASSET", assetId: "b0000000-0000-4000-8000-000000000002" }],
        context,
      ),
    ).toThrow();
    expect(() =>
      validateAssistantCommands([{ type: "GENERATE_IDEAS", projectId: assetId }], context),
    ).toThrow();
    expect(() =>
      validateAssistantCommands([{ type: "FOCUS_PANEL", panelId: "unknown" }], context),
    ).toThrow();
  });
  it("does not send a request or fabricate a reply without configuration", async () => {
    const fetcher = vi.fn();
    const provider = createXRAssistantProvider(parseServerEnv({}), fetcher);
    await expect(
      provider.respond({ message: "Help", language: "en-IN", context }),
    ).rejects.toMatchObject({ code: "PROVIDER_UNCONFIGURED" });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("labels the opt-in local development mock and never enables it in production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const env = parseServerEnv({ APP_MODE: "demo" });
    expect(getXRAssistantReadiness(env).mode).toBe("development-mock");
    const result = await createXRAssistantProvider(env).respond({
      message: "Generate ideas",
      language: "en-IN",
      context,
    });
    expect(result.mode).toBe("development-mock");
    expect(result.reply).toContain("Development mock");
    expect(result.commands).toEqual([]);
    vi.stubEnv("NODE_ENV", "production");
    expect(getXRAssistantReadiness(env).mode).toBe("unconfigured");
  });
  it("uses a fixed Gemini endpoint, bounded JSON output and no provider credentials in its result", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        Response.json({
          candidates: [
            {
              finishReason: "STOP",
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      reply: "Consider a craft story.",
                      commands: [{ type: "OPEN_ASSET", assetId }],
                    }),
                  },
                ],
              },
            },
          ],
        }),
      );
    const env = parseServerEnv({ GEMINI_API_KEY: "private-key", GEMINI_MODEL: "configured-model" });
    const result = await createXRAssistantProvider(env, fetcher).respond({
      message: "Help",
      language: "en-IN",
      context,
    });
    expect(result).toEqual({
      reply: "Consider a craft story.",
      commands: [{ type: "OPEN_ASSET", assetId }],
      mode: "live",
    });
    const [url, request] = fetcher.mock.calls[0];
    expect(url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/configured-model:generateContent",
    );
    expect(request.headers["x-goog-api-key"]).toBe("private-key");
    const body = JSON.parse(request.body);
    expect(body.generationConfig).toMatchObject({
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    });
    expect(body.tools).toBeUndefined();
    expect(JSON.stringify(result)).not.toContain("private-key");
  });
  it.each([
    { candidates: [] },
    { candidates: [{ finishReason: "MAX_TOKENS", content: { parts: [{ text: "{}" }] } }] },
    {
      candidates: [
        {
          finishReason: "STOP",
          content: { parts: [{ text: '{"reply":"Unsafe","commands":[{"type":"EVAL"}]}' }] },
        },
      ],
    },
    {
      candidates: [
        {
          finishReason: "STOP",
          content: {
            parts: [
              {
                text: JSON.stringify({
                  reply: "Foreign",
                  commands: [{ type: "GENERATE_IDEAS", projectId: assetId }],
                }),
              },
            ],
          },
        },
      ],
    },
  ])("rejects malformed, incomplete or unauthorized model output", async (body) => {
    const env = parseServerEnv({ GEMINI_API_KEY: "private-key", GEMINI_MODEL: "configured-model" });
    await expect(
      createXRAssistantProvider(env, vi.fn().mockResolvedValue(Response.json(body))).respond({
        message: "Help",
        language: "en-IN",
        context,
      }),
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  });
  it("sanitizes provider errors and refuses endpoint path injection in model configuration", async () => {
    const env = parseServerEnv({ GEMINI_API_KEY: "private-key", GEMINI_MODEL: "../other?secret" });
    const fetcher = vi.fn();
    await expect(
      createXRAssistantProvider(env, fetcher).respond({
        message: "Help",
        language: "en-IN",
        context,
      }),
    ).rejects.toMatchObject({ code: "PROVIDER_UNCONFIGURED" });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("bounds streamed provider output even when Content-Length is absent", async () => {
    const cancel = vi.fn();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(65_537));
      },
      cancel,
    });
    await expect(
      providerJson(
        vi.fn().mockResolvedValue(new Response(stream)),
        "https://provider.example.test",
        {},
      ),
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(cancel).toHaveBeenCalledOnce();
  });
  it("never exposes raw provider errors or follows an untrusted redirect", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response("private provider diagnostics", { status: 500 }));
    await expect(providerJson(fetcher, "https://provider.example.test", {})).rejects.toThrow(
      "The assistant provider could not complete this request.",
    );
    expect(fetcher.mock.calls[0][1]).toMatchObject({
      redirect: "error",
      cache: "no-store",
      signal: expect.any(AbortSignal),
    });
  });
});
