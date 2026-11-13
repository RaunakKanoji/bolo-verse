import { describe, expect, it } from "vitest";
import { portalTarget } from "../src/lib/portal-target";

describe("portal navigation recovery", () => {
  it("sends web-owned pages to the configured public origin while preserving query", () => {
    for (const path of [
      "/",
      "/workspace",
      "/projects",
      "/brainstorm",
      "/review",
      "/assets",
      "/clients",
      "/settings",
      "/profile",
      "/spatial-studio",
      "/recording-lab",
      "/app/projects",
      "/app/projects/123",
      "/reviews",
      "/studio/brainstorm",
      "/xr/preview",
      "/create",
    ]) {
      expect(portalTarget("http://127.0.0.1:3200", path, "?view=all")?.href).toBe(
        `http://127.0.0.1:3200${path}?view=all`,
      );
    }
  });
  it("does not redirect editor/API/assets or lookalike/authority paths", () => {
    for (const path of [
      "/workspace/demo",
      "/workspace/123",
      "/api/v1/projects",
      "/_next/a.js",
      "/spatial-static/a.js",
      "/app-other",
      "//attacker.test/app/projects",
      "/unknown",
    ]) {
      expect(portalTarget("https://portal.example", path, "")).toBeNull();
    }
  });
  it("refuses missing or credential/path/query-bearing public origins", () => {
    for (const origin of [
      undefined,
      "bad",
      "file:///tmp",
      "https://user:secret@portal.example",
      "https://portal.example/app",
      "https://portal.example?next=evil",
      "https://portal.example#fragment",
    ]) {
      expect(portalTarget(origin, "/app/projects", "")).toBeNull();
    }
  });
});
