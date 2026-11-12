import { describe, expect, it } from "vitest";
import { imageGeometry, sharpenPixels } from "@/features/playground/image-processing";

describe("playground image transformations", () => {
  it("center-crops before a quarter turn without changing the source geometry", () => {
    expect(imageGeometry(1200, 800, "square", 90, false)).toEqual({
      sx: 200,
      sy: 0,
      sw: 800,
      sh: 800,
      width: 800,
      height: 800,
    });
    expect(imageGeometry(1200, 800, "original", 90, false)).toEqual({
      sx: 0,
      sy: 0,
      sw: 1200,
      sh: 800,
      width: 800,
      height: 1200,
    });
    expect(imageGeometry(1200, 800, "portrait", 0, false)).toEqual({
      sx: 300,
      sy: 0,
      sw: 600,
      sh: 800,
      width: 600,
      height: 800,
    });
  });
  it("exports only the selected illustrative panel and rejects unsafe sizes or turns", () => {
    expect(imageGeometry(900, 400, "original", 0, true)).toEqual({
      sx: 0,
      sy: 0,
      sw: 300,
      sh: 400,
      width: 300,
      height: 400,
    });
    expect(() => imageGeometry(100000, 100000, "original", 0, false)).toThrow();
    expect(() => imageGeometry(20, 20, "original", 45, false)).toThrow();
  });
  it("sharpens real pixels while preserving alpha, borders and original bytes", () => {
    const bytes = new Uint8ClampedArray(3 * 3 * 4);
    for (let i = 0; i < bytes.length; i += 4) bytes.set([50, 50, 50, 128], i);
    bytes.set([100, 100, 100, 200], 16);
    const result = sharpenPixels(bytes, 3, 3, 50);
    expect([...result.slice(16, 20)]).toEqual([200, 200, 200, 200]);
    expect([...result.slice(0, 4)]).toEqual([50, 50, 50, 128]);
    expect([...bytes.slice(16, 20)]).toEqual([100, 100, 100, 200]);
    expect(() => sharpenPixels(bytes, 3000, 3000, 50)).toThrow();
  });
});
