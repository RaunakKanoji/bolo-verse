import { describe, expect, it } from "vitest";
import {
  assertProtectedPreviewUrl,
  assertTextureSize,
  disposeModelResources,
} from "@/xr/runtime/asset-preview";

describe("spatial media boundary", () => {
  const id = "30000000-0000-4000-8000-000000000003";
  it("allows only this asset's same-origin protected route", () => {
    expect(
      assertProtectedPreviewUrl(
        `/api/xr/assets/${id}`,
        id,
        "https://studio.test/studio/xr/project",
      ),
    ).toBe(`https://studio.test/api/xr/assets/${id}`);
    for (const url of [
      `https://evil.test/api/xr/assets/${id}`,
      "/api/xr/assets/another",
      `/api/xr/assets/${id}?token=secret`,
      `javascript:alert(1)`,
    ]) {
      expect(() =>
        assertProtectedPreviewUrl(url, id, "https://studio.test/studio/xr/project"),
      ).toThrow();
    }
  });
  it("rejects excessive decoded pixel counts and empty dimensions before creating textures", () => {
    expect(() => assertTextureSize(4096, 4096)).not.toThrow();
    expect(() => assertTextureSize(8193, 1)).toThrow();
    expect(() => assertTextureSize(8192, 8192)).toThrow();
    expect(() => assertTextureSize(0, 100)).toThrow();
  });
  it("releases shared model geometry/material/texture resources only once", () => {
    const calls: string[] = [];
    const texture = {
      isTexture: true,
      dispose: () => calls.push("texture"),
      image: { close: () => calls.push("bitmap") },
    };
    const material = { map: texture, dispose: () => calls.push("material") };
    const geometry = { dispose: () => calls.push("geometry") };
    const model = {
      traverse: (visit: (node: unknown) => void) => {
        visit({ geometry, material });
        visit({ geometry, material: [material] });
      },
    };
    disposeModelResources(model as unknown as Parameters<typeof disposeModelResources>[0]);
    expect(calls).toEqual(["geometry", "texture", "bitmap", "material"]);
  });
});
