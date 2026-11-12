import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { parseServerEnv } from "../../apps/web/src/server/config/env";
import { createProviderRegistry, getProviderReadiness } from "../../apps/web/src/server/providers";

describe("M0 provider boundary", () => {
  it("reports missing configuration without exposing credential values", () => {
    const statuses = getProviderReadiness(parseServerEnv({ SARVAM_API_KEY: "private-test-value" }));
    expect(statuses.find((provider) => provider.id === "sarvam-stt")).toMatchObject({ status: "unconfigured", missing: ["SARVAM_STT_MODEL"] });
    expect(JSON.stringify(statuses)).not.toContain("private-test-value");
  });

  it("never treats present credentials as a verified live integration", () => {
    const statuses = getProviderReadiness(parseServerEnv({ SARVAM_API_KEY: "placeholder", SARVAM_STT_MODEL: "requires-verification" }));
    expect(statuses.find((provider) => provider.id === "sarvam-stt")?.status).toBe("configured-unverified");
    expect(statuses.some((provider) => provider.status === "ready")).toBe(false);
  });

  it("fails missing STT configuration explicitly rather than returning fabricated text", async () => {
    const providers = createProviderRegistry(parseServerEnv({}));
    await expect(providers.stt.transcribe({ audio: new Uint8Array([0]), mimeType: "audio/wav", language: "en-IN" })).rejects.toMatchObject({ code: "PROVIDER_UNCONFIGURED", retryable: false });
  });

  it("fails configured but unimplemented calls without making a network request", async () => {
    const providers = createProviderRegistry(parseServerEnv({ GEMINI_API_KEY: "placeholder", GEMINI_MODEL: "requires-verification" }));
    await expect(providers.reasoning.interpret({ transcript: "help", language: "en-IN", mode: "command" })).rejects.toMatchObject({ code: "PROVIDER_NOT_IMPLEMENTED", retryable: false });
  });

  it("does not expose invented editor capabilities or storage URLs", async () => {
    const providers = createProviderRegistry(parseServerEnv({}));
    await expect(providers.editor.getCapabilities()).rejects.toMatchObject({ code: "PROVIDER_UNCONFIGURED" });
    await expect(providers.storage.createReadUrl({ objectKey: "private/object", expiresInSeconds: 60 })).rejects.toMatchObject({ code: "PROVIDER_UNCONFIGURED" });
    expect(providers.editor.cancelRender).toBeUndefined();
  });
});
