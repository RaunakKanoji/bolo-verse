import { describe, expect, it } from "vitest";
import { buildDemoDataset } from "@/lib/demo/dataset";
import { validateDemoDataset } from "@/lib/demo/validate";
import { parseDemoConfig } from "@/server/demo/config";

describe("demo seed", () => {
  it("requires explicit opt-in and rejects production and remote targets", () => {
    expect(() => parseDemoConfig({})).toThrow();
    for (const env of [
      { NODE_ENV: "production" },
      { VERCEL_ENV: "production" },
      { VERCEL_TARGET_ENV: "production" },
      { DATABASE_URL: "postgres://x:secret@prod.example/app" },
    ]) {
      expect(() => parseDemoConfig({ DEMO_SEED_ENABLED: "true", ...env })).toThrow();
    }
    expect(parseDemoConfig({ DEMO_SEED_ENABLED: "true" }).slug).toBe("shape-xr-demo");
    expect(() =>
      parseDemoConfig({ DEMO_SEED_ENABLED: "true", DEMO_WORKSPACE_SLUG: "../private" }),
    ).toThrow();
  });
  it("is deterministic, connected, complete and uses the configured reference date", () => {
    const a = buildDemoDataset();
    expect(buildDemoDataset()).toEqual(a);
    const report = validateDemoDataset(a);
    expect(report.errors).toEqual([]);
    expect(report.counts).toMatchObject({
      clients: 5,
      projects: 12,
      conversations: 20,
      scripts: 15,
      storyboards: 10,
      content: 40,
      voice: 15,
      layouts: 3,
    });
    expect(report.counts.comments).toBeGreaterThanOrEqual(20);
    expect(buildDemoDataset({ referenceDate: "2026-12-01" }).projects[0].createdAt).not.toBe(
      a.projects[0].createdAt,
    );
  });
  it("detects invalid links, missing brief detail and mismatched storyboard timing", () => {
    const data = buildDemoDataset();
    data.projects[0].clientId = "missing";
    data.projects[0].brief.audience = "";
    data.projects[0].storyboard!.payload.shots[0].durationSeconds = 99;
    expect(validateDemoDataset(data).errors.length).toBeGreaterThanOrEqual(3);
  });
});
