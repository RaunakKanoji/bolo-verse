import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { imageDimensions } from "@/lib/contracts/xr-image-metadata";
import { validateIngestedImage } from "@/server/services/image-ingestion";

const png = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVQImWMwMjL6DwACxgGWgWwZRAAAAABJRU5ErkJggg==", "base64"));
const jpeg = Uint8Array.from(Buffer.from("/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAADAAIDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAABgf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCYAqoa/9k=", "base64"));
const webp = Uint8Array.from(Buffer.from("UklGRjoAAABXRUJQVlA4IC4AAADQAQCdASoCAAMAAUAmJaACdLoB+AADsAD+5fo/+2h/Wh/Wh/2sf/mwNUWb5aAA", "base64"));
const validate = (bytes: Uint8Array, mimeType: string) => Promise.resolve().then(() => validateIngestedImage({ bytes, mimeType,
  byteSize: bytes.length, checksumSha256: createHash("sha256").update(bytes).digest("hex") }));

describe("full private image decode validation", () => {
  it("rejects a 45-byte PNG with valid dimensions but no pixel data", async () => {
    const corrupt = Uint8Array.from([...png.slice(0, 33), ...png.slice(-12)]);
    expect(corrupt).toHaveLength(45);
    expect(imageDimensions(corrupt, "image/png")).toEqual({ width: 1, height: 1 });
    await expect(validate(corrupt, "image/png")).rejects.toMatchObject({ status: 400, code: "INVALID_INPUT" });
  });
  it("rejects a JPEG truncated before its compressed image scan", async () => {
    const scanAt = jpeg.findIndex((value, at) => value === 0xff && jpeg[at + 1] === 0xda);
    const corrupt = Uint8Array.from([...jpeg.slice(0, scanAt), 0xff, 0xd9]);
    expect(imageDimensions(corrupt, "image/jpeg")).toEqual({ width: 2, height: 3 });
    await expect(validate(corrupt, "image/jpeg")).rejects.toMatchObject({ status: 400, code: "INVALID_INPUT" });
  });
  it("rejects a WebP with coherent RIFF dimensions and missing pixel data", async () => {
    const corrupt = webp.slice(0, 30), view = new DataView(corrupt.buffer);
    view.setUint32(4, corrupt.length - 8, true); view.setUint32(16, 10, true);
    expect(imageDimensions(corrupt, "image/webp")).toEqual({ width: 2, height: 3 });
    await expect(validate(corrupt, "image/webp")).rejects.toMatchObject({ status: 400, code: "INVALID_INPUT" });
  });
  it.each([["image/png", png, 1, 1], ["image/jpeg", jpeg, 2, 3], ["image/webp", webp, 2, 3]] as const)(
    "preserves genuine bounded static %s images", async (mimeType, bytes, width, height) => {
      await expect(validate(bytes, mimeType)).resolves.toMatchObject({ width, height, byteSize: bytes.length, mimeType });
    },
  );
});
