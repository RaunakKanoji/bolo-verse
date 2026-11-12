import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function checkEnvironment(overrides: Record<string, string>) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (key === "VERCEL" || key.startsWith("VERCEL_") || key.startsWith("TURBO_")) delete env[key];
  }
  Object.assign(env, {
    TURBO_TELEMETRY_DISABLED: "1", APP_MODE: "live",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000", ALLOWED_ORIGINS: "", DATABASE_URL: "", DATABASE_MIGRATION_URL: "",
    ...overrides,
  });
  const result = spawnSync(resolve("node_modules/.bin/turbo"), ["run", "env:check", "--env-mode=strict", "--force", "--output-logs=full"], {
    env, encoding: "utf8", timeout: 20_000,
  });
  if (result.error) throw result.error;
  return { status: result.status, output: result.stdout + result.stderr };
}

describe("workspace environment boundary through the actual Turbo runner", () => {
  it("keeps optional integrations unavailable without requiring credentials", () => {
    const result = checkEnvironment({ APP_MODE: "demo" });
    expect(result.status).toBe(0);
    expect(result.output).toContain("Server environment is valid.");
  });

  it.each<Record<string, string>>([{ VERCEL: "1" }, { VERCEL_ENV: "preview" }, { VERCEL_TARGET_ENV: "production" }])(
    "preserves deployment markers and rejects local demo mode: %o", (deployment) => {
      const result = checkEnvironment({ APP_MODE: "demo", ...deployment });
      expect(result.status).not.toBe(0);
      expect(result.output).toContain("Invalid server environment: APP_MODE.");
    },
  );

  it("does not expose invalid credential values in diagnostic output", () => {
    const privateValue = "https://never-log-this-private-value.example/credential";
    const result = checkEnvironment({ DATABASE_URL: privateValue });
    expect(result.status).not.toBe(0);
    expect(result.output).toContain("Invalid server environment: DATABASE_URL.");
    expect(result.output).not.toContain(privateValue);
  });
});
