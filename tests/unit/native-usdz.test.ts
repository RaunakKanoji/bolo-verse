import { describe, expect, it } from "vitest";
import { MAX_NATIVE_CONTENT_BYTES, nativeContentSupported, validateNativeUSDZ } from "@/lib/contracts/native-assets";
import { previewSupported } from "@/lib/contracts/xr-assets";
import { storedUSDZ, tinyPNG } from "../helpers/usdz";
const stage = { name: "model.usda", bytes: new TextEncoder().encode("#usda 1.0") };
describe("native USDZ delivery boundary", () => {
  it("accepts a stored USD stage and bounded PNG texture without enabling browser USDZ", () => {
    expect(() => validateNativeUSDZ(storedUSDZ([stage, { name: "textures/albedo.png", bytes: tinyPNG }]).bytes)).not.toThrow();
    expect(nativeContentSupported("model/vnd.usdz+zip", MAX_NATIVE_CONTENT_BYTES)).toBe(true);
    expect(previewSupported("model/vnd.usdz+zip", 100)).toBe(false);
    for (const size of [0, -1, Infinity, MAX_NATIVE_CONTENT_BYTES + 1]) expect(nativeContentSupported("model/vnd.usdz+zip", size)).toBe(false);
    expect(nativeContentSupported("model/gltf-binary", 100)).toBe(false);
  });
  it.each(["usda", ".usda", "../model.usda", "/model.usda", "a/../model.usda", "a//model.usda", "a/./model.usda", "a\\model.usda", "https:model.usda", "model\u0000.usda", "script.js"])("rejects escaping or unsupported entry %s", (name) => {
    expect(() => validateNativeUSDZ(storedUSDZ([{ ...stage, name }]).bytes)).toThrow();
  });
  it("rejects compression, encryption, descriptors, links and duplicate names", () => {
    for (const options of [{ method: 8 }, { flags: 1 }, { flags: 8 }, { externalMode: 0xa000 }]) expect(() => validateNativeUSDZ(storedUSDZ([stage], options).bytes)).toThrow();
    expect(() => validateNativeUSDZ(storedUSDZ([stage, { ...stage, name: "MODEL.USDA" }]).bytes)).toThrow();
    expect(() => validateNativeUSDZ(storedUSDZ([{ name: "texture.png", bytes: tinyPNG }, stage]).bytes)).toThrow();
  });
  it("rejects truncated, multidisk, ZIP64 and inconsistent local/central records", () => {
    const archive = storedUSDZ();
    expect(() => validateNativeUSDZ(archive.bytes.subarray(0, archive.bytes.length - 1))).toThrow();
    for (const [offset, value, width] of [
      [archive.endOffset + 4, 1, 2], [archive.endOffset + 10, 65535, 2],
      [archive.localOffsets[0] + 22, 0xffffffff, 4], [archive.centralOffsets[0] + 42, 0xffffffff, 4],
    ]) {
      const copy = Buffer.from(archive.bytes);
      if (width === 2) copy.writeUInt16LE(value, offset); else copy.writeUInt32LE(value, offset);
      expect(() => validateNativeUSDZ(copy)).toThrow();
    }
  });
  it("enforces archive, entry, texture-count, dimensions and aggregate pixel budgets", () => {
    expect(() => validateNativeUSDZ(new Uint8Array(MAX_NATIVE_CONTENT_BYTES + 1))).toThrow();
    expect(() => validateNativeUSDZ(storedUSDZ(Array.from({ length: 65 }, (_, index) => ({ ...stage, name: `${index}.usda` }))).bytes)).toThrow();
    expect(() => validateNativeUSDZ(storedUSDZ([stage, ...Array.from({ length: 17 }, (_, index) => ({ name: `${index}.png`, bytes: tinyPNG }))]).bytes)).toThrow();
    const wide = Buffer.from(tinyPNG); wide.writeUInt32BE(4097, 16);
    expect(() => validateNativeUSDZ(storedUSDZ([stage, { name: "wide.png", bytes: wide }]).bytes)).toThrow();
    const large = Buffer.from(tinyPNG); large.writeUInt32BE(4096, 16); large.writeUInt32BE(4096, 20);
    expect(() => validateNativeUSDZ(storedUSDZ([stage, { name: "a.png", bytes: large }, { name: "b.png", bytes: large }]).bytes)).toThrow();
    expect(() => validateNativeUSDZ(storedUSDZ([stage, { name: "bad.jpg", bytes: new Uint8Array([1, 2]) }]).bytes)).toThrow();
  });
});
