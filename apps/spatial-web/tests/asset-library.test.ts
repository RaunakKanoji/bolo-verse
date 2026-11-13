import { expect, it } from "vitest";
import { createSpatialApi } from "../src/lib/api";
import { createSpatialFixture } from "../../../tests/browser-fixtures/spatial-workspace-data";

it("refreshes only strict assets from the current project using the private no-store endpoint", async () => {
  const fixture = createSpatialFixture();
  const controller = new AbortController();
  let payload: unknown = { assets: fixture.assets, hasMore: false };
  const api = createSpatialApi(async (path, options) => {
    expect(path).toBe(`/api/v1/projects/${fixture.project.id}/assets`);
    expect(options?.cache).toBe("no-store");
    expect(options?.signal).toBe(controller.signal);
    return new Response(JSON.stringify({ ok: true, data: payload, requestId: "test" }));
  });
  expect(await api.listAssets(fixture.project.id, controller.signal)).toEqual(payload);
  for (const asset of [{ ...fixture.assets[0], projectId: fixture.assets[0].id }, { ...fixture.assets[0], contentUrl: fixture.assets[1].contentUrl }, { ...fixture.assets[0], objectKey: "private" }]) {
    payload = { assets: [asset], hasMore: false };
    await expect(api.listAssets(fixture.project.id, controller.signal)).rejects.toThrow();
  }
});
