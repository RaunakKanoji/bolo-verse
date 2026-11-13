import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import manifest from "@/lib/demo/asset-manifest.json";
import { readDemoFixture } from "@/server/demo/fixtures";
import { validatePreviewAsset } from "@/lib/contracts/xr-assets";

describe("bundled original demo previews", () => {
  it("validates all 35 accessible PNG files, hashes and byte sizes", async () => {
    expect(Object.keys(manifest)).toHaveLength(35);
    for (const [key, fixture] of Object.entries(manifest)) {
      const stored = await readFile(`apps/web/public/demo-assets/${fixture.file}`);
      const read = readDemoFixture(
        `${key}#a7000000-0000-4000-8000-000000000001`,
        fixture.byteSize,
      )!;
      expect(stored).toEqual(Buffer.from(read.bytes));
      expect(createHash("sha256").update(read.bytes).digest("hex")).toBe(fixture.checksumSha256);
      expect(read.bytes.byteLength).toBe(fixture.byteSize);
      expect(() => validatePreviewAsset(read.bytes, "image/png")).not.toThrow();
    }
  });
  it("fails closed for unknown fixtures and oversized reads without touching storage", () => {
    expect(readDemoFixture("private/images/unrelated", 1024)).toBeNull();
    expect(() => readDemoFixture("demo-fixtures/../../private", 1024)).toThrow();
    expect(() => readDemoFixture(Object.keys(manifest)[0], 1)).toThrow();
  });
});
