import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { demoPreflight } from "../../scripts/lib/demo-preflight";

describe("configuration-only demo preflight", () => {
  it("fails closed with actionable variable names when configuration is absent", () => {
    const result = demoPreflight({});
    expect(result.configurationComplete).toBe(false);
    expect(result.liveVerified).toBe(false);
    expect(result.groups.find(g => g.id === "identity")?.missing).toEqual(["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"]);
    expect(result.groups.find(g => g.id === "image-generation")?.missing).toContain("GEMINI_IMAGE_MODEL");
    expect(result.groups.find(g => g.id === "speech")?.missing).toContain("SARVAM_STT_MODEL");
  });
  it("never returns values, treats whitespace and known placeholders as missing, and does not equate configuration with acceptance", () => {
    const keys = demoPreflight({}).groups.flatMap(g => g.missing);
    const env = Object.fromEntries(keys.map(k => [k, "secret-marker-value"]));
    const result = demoPreflight(env);
    expect(result.configurationComplete).toBe(true);
    expect(result.liveVerified).toBe(false);
    expect(JSON.stringify(result)).not.toContain("secret-marker-value");
    env.CLERK_SECRET_KEY = "   ";
    env.R2_SECRET_ACCESS_KEY = "YOUR_SECRET_ACCESS_KEY";
    env.GEMINI_MODEL = "replace-me";
    env.GEMINI_IMAGE_MODEL = "<model-id>";
    expect(demoPreflight(env).groups.flatMap(g => g.missing)).toEqual(expect.arrayContaining(["CLERK_SECRET_KEY", "R2_SECRET_ACCESS_KEY", "GEMINI_MODEL", "GEMINI_IMAGE_MODEL"]));
  });
  it("the CLI rejects malformed configuration without printing its secret input", () => {
    const result = spawnSync(process.execPath, ["--conditions=react-server", "--import", resolve("node_modules/tsx/dist/loader.mjs"), resolve("scripts/demo-preflight.ts")], {
      cwd: tmpdir(), env: { ...process.env, DATABASE_URL: "not-a-database-secret-marker", NEXT_PUBLIC_APP_URL: "http://localhost:3000", ALLOWED_ORIGINS: "http://localhost:3000", APP_MODE: "live" }, encoding: "utf8",
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("DATABASE_URL");
    expect(result.stderr + result.stdout).not.toContain("not-a-database-secret-marker");
  });
});
