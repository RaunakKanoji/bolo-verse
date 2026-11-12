import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { parseServerEnv } from "../../src/server/config/env";

describe("lazy server configuration", () => {
  it("allows unconfigured M0 without requiring unused credentials", () => {
    const env = parseServerEnv({ CLERK_SECRET_KEY: "", SARVAM_API_KEY: " " });
    expect(env.APP_MODE).toBe("live");
    expect(env.CLERK_SECRET_KEY).toBeUndefined();
    expect(env.SARVAM_API_KEY).toBeUndefined();
    expect(env.ENABLE_EXTERNAL_EDITOR).toBe(false);
    expect(env.ALLOWED_ORIGINS).toEqual(["http://localhost:3000"]);
  });

  it("explicitly falls back to the application database URL for migrations", () => {
    const env = parseServerEnv({ DATABASE_URL: "postgresql://example:placeholder@localhost/boloverse" });
    expect(env.DATABASE_MIGRATION_URL).toBe("postgresql://example:placeholder@localhost/boloverse");
  });

  it("allows labeled local demo but blocks demo in all Vercel contexts", () => {
    expect(parseServerEnv({ APP_MODE: "demo" }).APP_MODE).toBe("demo");
    for (const deployment of [{ VERCEL: "1" }, { VERCEL_ENV: "preview" }, { VERCEL_ENV: "production" }]) {
      expect(() => parseServerEnv({ APP_MODE: "demo", ...deployment })).toThrow();
    }
  });

  it("does not interpret false strings as enabled feature flags", () => {
    expect(parseServerEnv({ ENABLE_BACKGROUND_REMOVAL: "false" }).ENABLE_BACKGROUND_REMOVAL).toBe(false);
    expect(parseServerEnv({ ENABLE_BACKGROUND_REMOVAL: "true" }).ENABLE_BACKGROUND_REMOVAL).toBe(true);
    expect(() => parseServerEnv({ ENABLE_BACKGROUND_REMOVAL: "yes" })).toThrow();
  });

  it("accepts only explicit HTTP origins and a bounded retention period", () => {
    expect(parseServerEnv({ ALLOWED_ORIGINS: "https://example.com, http://localhost:3000" }).ALLOWED_ORIGINS).toEqual(["https://example.com", "http://localhost:3000"]);
    expect(() => parseServerEnv({ ALLOWED_ORIGINS: "*" })).toThrow();
    expect(() => parseServerEnv({ ALLOWED_ORIGINS: "https://example.com/private" })).toThrow();
    expect(() => parseServerEnv({ COMMAND_LOG_RETENTION_DAYS: "-1" })).toThrow();
    expect(() => parseServerEnv({ DATABASE_URL: "https://example.com" })).toThrow();
  });
});
