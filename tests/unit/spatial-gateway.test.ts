import { describe, expect, it } from "vitest";
import { spatialTarget } from "@/lib/routing/spatial-target";

describe("spatial gateway ownership", () => {
  it("uses the current configured origin and preserves workspace and asset requests", () => {
    expect(spatialTarget("http://127.0.0.1:3201", "/workspace/project", "?view=edit")?.href).toBe("http://127.0.0.1:3201/workspace/project?view=edit");
    expect(spatialTarget("http://127.0.0.1:4401", "/spatial-static/_next/static/chunks/a.js", "")?.href).toBe("http://127.0.0.1:4401/spatial-static/_next/static/chunks/a.js");
  });
  it("never forwards APIs, legacy runtimes, prefix lookalikes or other public routes", () => {
    for (const path of ["/api/v1/projects", "/xr/preview", "/studio/xr/project", "/_next/a.js", "/workspace-other", "/spatial-static-other", "//foreign.example/workspace"]) {
      expect(spatialTarget("http://127.0.0.1:3201", path, "")).toBeNull();
    }
  });
  it("rejects credential-bearing, non-origin and non-HTTP configuration without leaking its value", () => {
    for (const origin of ["https://user:private@example.test", "https://example.test/path", "https://example.test?token=private", "https://example.test#private", "file:///private"]) {
      expect(() => spatialTarget(origin, "/workspace", "")).toThrow("Configure an exact HTTP(S) spatial origin.");
    }
  });
});
