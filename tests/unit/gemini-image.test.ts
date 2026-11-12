import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { createGeminiImageProvider, getImageGenerationCapabilities } from "@/server/providers/gemini-image";
import { parseServerEnv } from "@/server/config/env";
const env = () => parseServerEnv({ GEMINI_API_KEY: "private-key", GEMINI_IMAGE_MODEL: "gemini-3.1-flash-image", DATABASE_URL: "postgres://test", CLERK_SECRET_KEY: "secret", NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test", R2_ACCOUNT_ID: "a".repeat(32), R2_ACCESS_KEY_ID: "id", R2_SECRET_ACCESS_KEY: "secret", R2_BUCKET: "private" });
const image = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVQImWMwMjL6DwACxgGWgWwZRAAAAABJRU5ErkJggg==", "base64");
const input = { prompt: "A fragrance in sunlight", modelId: "gemini-3.1-flash-image" as const, aspectRatio: "16:9" as const, reference: null };
const result = (parts: unknown[]) => Response.json({ candidates: [{ finishReason: "STOP", content: { parts } }] });
afterEach(() => vi.restoreAllMocks());
describe("Gemini image adapter", () => {
  it("reports only a configured supported model, never treats an API key alone as a connected pipeline", () => {
    expect(getImageGenerationCapabilities(parseServerEnv({ GEMINI_API_KEY: "key" }))).toMatchObject({ availability: "unconfigured", models: [] });
    expect(getImageGenerationCapabilities(env())).toMatchObject({ availability: "configured", models: [{ id: input.modelId, referenceImage: true }] });
    expect(getImageGenerationCapabilities({ ...env(), GEMINI_IMAGE_MODEL: "attacker/model" })).toMatchObject({ availability: "unconfigured", models: [] });
  });
  it("uses a fixed provider origin, private header and bounded inline image reference", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(result([{ inlineData: { mimeType: "image/png", data: image.toString("base64") } }]));
    const provider = createGeminiImageProvider(env(), fetcher);
    const generated = await provider.generate({ ...input, reference: { bytes: image, mimeType: "image/png" } });
    expect(generated.bytes).toEqual(new Uint8Array(image));
    const [url, options] = fetcher.mock.calls[0];
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent");
    expect(url).not.toContain("private-key");
    expect(options).toMatchObject({ redirect: "error", cache: "no-store", headers: { "x-goog-api-key": "private-key" } });
    expect(JSON.parse(options!.body as string)).toMatchObject({ contents: [{ parts: [{ text: input.prompt }, { inlineData: { mimeType: "image/png", data: image.toString("base64") } }] }], generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "16:9" } } });
  });
  it("rejects unsupported models and malformed references before dispatch", async () => {
    const fetcher = vi.fn<typeof fetch>(); const provider = createGeminiImageProvider(env(), fetcher);
    await expect(provider.generate({ ...input, modelId: "gemini-2.5-flash-image" })).rejects.toMatchObject({ status: 503 });
    await expect(provider.generate({ ...input, reference: { bytes: new Uint8Array([0]), mimeType: "image/png" } })).rejects.toMatchObject({ status: 400 });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([
    [{ inlineData: { mimeType: "image/svg+xml", data: image.toString("base64") } }],
    [{ inlineData: { mimeType: "image/png", data: "bad base64" } }],
    [{ text: "Unable to generate" }],
    [{ thought: true, inlineData: { mimeType: "image/png", data: image.toString("base64") } }],
    [{ inlineData: { mimeType: "image/png", data: image.toString("base64") } }, { inlineData: { mimeType: "image/png", data: image.toString("base64") } }],
  ])("rejects unusable output without publishing it", async (...parts) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(result(parts));
    await expect(createGeminiImageProvider(env(), fetcher).generate(input)).rejects.toMatchObject({ status: 503 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("bounds streamed bytes and sanitizes provider errors without automatic retries", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("secret provider failure", { status: 429 }));
    await expect(createGeminiImageProvider(env(), fetcher).generate(input)).rejects.toMatchObject({ status: 429, message: expect.not.stringContaining("secret") });
    expect(fetcher).toHaveBeenCalledTimes(1);
    fetcher.mockResolvedValue(new Response("{}", { headers: { "Content-Length": "999999999" } }));
    await expect(createGeminiImageProvider(env(), fetcher).generate(input)).rejects.toMatchObject({ status: 503 });
  });
});
