import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { providerJson } from "@/server/providers/xr-http";

afterEach(() => vi.useRealTimers());
describe("bounded opt-in provider retry", () => {
  it("retries a transient HTTP failure once, while existing callers remain single-attempt", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn().mockResolvedValueOnce(new Response("busy", { status: 503 })).mockResolvedValueOnce(Response.json({ ok: true }));
    const result = expect(providerJson(fetcher, "https://provider.test", {}, 65536, { retryTransient: true })).resolves.toEqual({ ok: true });
    await vi.runAllTimersAsync();
    await result;
    expect(fetcher).toHaveBeenCalledTimes(2);
    const old = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));
    await expect(providerJson(old, "https://provider.test", {})).rejects.toMatchObject({ status: 503 });
    expect(old).toHaveBeenCalledTimes(1);
  });
});

import { BrainstormRequestSchema, redactBrainstormText } from "@/lib/contracts/brainstorm";
import { createGeminiBrainstormProvider } from "@/server/providers/gemini-brainstorm";
import { parseServerEnv } from "@/server/config/env";
const directions = ["Craft story", "Everyday use", "A gift"].map((name) => ({ name, concept: "Show the craft", visualDirection: "Warm light", proposedDeliverable: "Poster", productionSuggestion: "Close-up of the weave" }));
const envelope = (text: string, finishReason = "STOP") => Response.json({ candidates: [{ finishReason, content: { parts: [{ text }] } }] });
const env = parseServerEnv({ GEMINI_API_KEY: "private-gemini-key", GEMINI_MODEL: "configured-model" });
const input = { message: "Three directions", briefContext: '{"objective":"Launch silk","audience":"Shoppers","constraints":["Approved logo"]}', sourceBriefVersion: 4 };

describe("brief-aware Gemini provider", () => {
  it("sends the bounded authorized context to Gemini without tools or a mock fallback", async () => {
    const fetcher = vi.fn().mockResolvedValue(envelope(JSON.stringify({ reply: "Three possible directions", directions })));
    const result = await createGeminiBrainstormProvider(env, fetcher).respond(input);
    expect(result).toMatchObject({ directions, sourceBriefVersion: 4, providerStatus: "live", format: "structured" });
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, request] = fetcher.mock.calls[0];
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/models/configured-model:generateContent");
    expect(request.headers["x-goog-api-key"]).toBe("private-gemini-key");
    const body = JSON.parse(request.body);
    expect(body.generationConfig).toMatchObject({ maxOutputTokens: 2048, responseMimeType: "application/json" });
    expect(body.tools).toBeUndefined();
    expect(body.systemInstruction.parts[0].text).toContain("untrusted");
    expect(body.contents[0].parts[0].text).toContain("Launch silk");
    expect(body.contents[0].parts[0].text).not.toContain("private-gemini-key");
  });
  it("never fabricates success when Gemini is absent, even in local demo mode", async () => {
    const fetcher = vi.fn();
    await expect(createGeminiBrainstormProvider(parseServerEnv({ APP_MODE: "demo" }), fetcher).respond(input)).rejects.toMatchObject({ status: 503, code: "PROVIDER_UNCONFIGURED" });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each(["A plain creative idea", '{"reply":"Ideas","commands":[{"type":"EVAL"}]}', '{"directions":'])("labels malformed/foreign structured output as plain text without actions: %s", async (text) => {
    const result = await createGeminiBrainstormProvider(env, vi.fn().mockResolvedValue(envelope(text))).respond(input);
    expect(result).toMatchObject({ format: "plain_text", directions: [], reply: text });
    expect(Object.keys(result)).not.toContain("commands");
  });
  it("bounds plain text and rejects incomplete or blocked envelopes without retry", async () => {
    const long = await createGeminiBrainstormProvider(env, vi.fn().mockResolvedValue(envelope("界".repeat(10000)))).respond(input);
    expect(long.reply.length).toBe(6000);
    for (const response of [envelope("{}", "MAX_TOKENS"), Response.json({ candidates: [] }), Response.json({ promptFeedback: { blockReason: "SAFETY" } })]) {
      const fetcher = vi.fn().mockResolvedValue(response);
      await expect(createGeminiBrainstormProvider(env, fetcher).respond(input)).rejects.toMatchObject({ status: 503 });
      expect(fetcher).toHaveBeenCalledTimes(1);
    }
  });
  it("redacts known secrets and signed URLs from requests and responses", async () => {
    const fetcher = vi.fn().mockResolvedValue(envelope("private-gemini-key https://storage.test/private?signature=secret"));
    const result = await createGeminiBrainstormProvider(env, fetcher).respond({ ...input, message: "token=secret https://user:pass@example.com", briefContext: "private-gemini-key" });
    expect(result.reply).not.toContain("private-gemini-key");
    expect(result.reply).not.toContain("signature");
    expect(String(fetcher.mock.calls[0][1].body)).not.toContain("token=secret");
    expect(String(fetcher.mock.calls[0][1].body)).not.toContain("private-gemini-key");
    expect(redactBrainstormText("Bearer abc.def.ghi")).toBe("[redacted]");
  });
  it("does not retry ambiguous timeouts, network errors or non-transient client rejection", async () => {
    for (const cause of [new DOMException("private details", "TimeoutError"), new TypeError("network private details")]) {
      const fetcher = vi.fn().mockRejectedValue(cause);
      await expect(createGeminiBrainstormProvider(env, fetcher).respond(input)).rejects.toMatchObject({ status: 503 });
      expect(fetcher).toHaveBeenCalledTimes(1);
    }
    const fetcher = vi.fn().mockResolvedValue(new Response("private", { status: 403 }));
    await expect(createGeminiBrainstormProvider(env, fetcher).respond(input)).rejects.toMatchObject({ status: 503 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("bounds inputs and never accepts arbitrary project context/history/tools", () => {
    expect(BrainstormRequestSchema.safeParse({ message: "Help", briefVersion: 1 }).success).toBe(true);
    for (const body of [{ message: " " }, { message: "x".repeat(2001) }, { message: "Help", history: [] }, { message: "Help", projectContext: "foreign" }, { message: "Help", briefVersion: 0 }]) expect(BrainstormRequestSchema.safeParse(body).success).toBe(false);
  });
});

describe("retry and envelope edge cases", () => {
  it.each([429, 503])("stops after two explicit transient %s responses and shares one deadline signal", async (status) => {
    vi.useFakeTimers();
    const fetcher = vi.fn().mockImplementation(async () => new Response(null, { status }));
    const assertion = expect(providerJson(fetcher, "https://provider.test", {}, 65536, { retryTransient: true })).rejects.toMatchObject({ status });
    await vi.runAllTimersAsync(); await assertion;
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0][1].signal).toBe(fetcher.mock.calls[1][1].signal);
  });
  it("honors longer provider Retry-After and cancelled requests without an extra call", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 429, headers: { "Retry-After": "60" } }));
    await expect(providerJson(fetcher, "https://provider.test", {}, 65536, { retryTransient: true })).rejects.toMatchObject({ status: 429 });
    expect(fetcher).toHaveBeenCalledTimes(1);
    const controller = new AbortController(); controller.abort(); fetcher.mockClear();
    await expect(providerJson(fetcher, "https://provider.test", { signal: controller.signal }, 65536, { retryTransient: true })).rejects.toMatchObject({ status: 503 });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("excludes model thought parts and bounds the provider response before parsing", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ thought: true, text: "Internal thought must not be shown" }, { text: JSON.stringify({ reply: "Final ideas", directions }) }] } }] }));
    const result = await createGeminiBrainstormProvider(env, fetcher).respond(input);
    expect(result).toMatchObject({ reply: "Final ideas", format: "structured" });
    const oversized = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new Uint8Array(65537)); } });
    await expect(createGeminiBrainstormProvider(env, vi.fn().mockResolvedValue(new Response(oversized))).respond(input)).rejects.toMatchObject({ status: 503 });
  });
});

it("redacts escaped secrets and URLs after decoding model JSON, including invalid structured fallback", async () => {
  const encoded = JSON.stringify({ reply: "private-gemini-key https://storage.test/private?signature=secret", directions }).replaceAll("key", "\\u006bey").replaceAll("https://", "https:\\u002f\\u002f");
  const fetcher = vi.fn().mockResolvedValue(envelope(encoded));
  const result = await createGeminiBrainstormProvider(env, fetcher).respond(input);
  expect(result.format).toBe("structured");
  expect(JSON.stringify(result)).not.toContain("private-gemini-key");
  expect(JSON.stringify(result)).not.toContain("https://");
  const invalid = '{"reply":"private-gemini-\\u006bey","commands":[]}';
  const plain = await createGeminiBrainstormProvider(env, vi.fn().mockResolvedValue(envelope(invalid))).respond(input);
  expect(plain.format).toBe("plain_text");
  expect(plain.reply).not.toContain("private-gemini-");
});
