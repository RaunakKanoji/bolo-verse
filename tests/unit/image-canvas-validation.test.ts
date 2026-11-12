import { afterEach, expect, it, vi } from "vitest";
import { createValidatedCanvasImageUrl } from "@/features/workspace/useImageCanvas";

afterEach(() => vi.restoreAllMocks());
const png = () => Uint8Array.from(Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j7M0AAAAASUVORK5CYII=", "base64",
));
const blob = (bytes: Uint8Array) => new Blob([bytes.slice().buffer as ArrayBuffer], { type: "image/png" });

it("rejects a small image with excessive decoded dimensions before exposing a decoder URL", async () => {
  const bytes = png();
  const header = new DataView(bytes.buffer);
  header.setUint32(16, 100_000);
  header.setUint32(20, 100_000);
  const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:unsafe-image");
  await expect(createValidatedCanvasImageUrl(blob(bytes), new AbortController().signal)).rejects.toThrow(/dimension|pixel/);
  expect(create).not.toHaveBeenCalled();
});

it("keeps genuine static PNG imports usable", async () => {
  const input = blob(png());
  const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:validated-image");
  await expect(createValidatedCanvasImageUrl(input, new AbortController().signal)).resolves.toBe("blob:validated-image");
  expect(create).toHaveBeenCalledExactlyOnceWith(input);
});

it("rejects disguised image content before exposing a decoder URL", async () => {
  const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:unsafe-image");
  await expect(createValidatedCanvasImageUrl(new Blob(["<svg/>"], { type: "image/png" }), new AbortController().signal)).rejects.toThrow();
  expect(create).not.toHaveBeenCalled();
});

it("does not create a URL when import is cancelled during the file read", async () => {
  const input = blob(png());
  let finish!: (bytes: ArrayBuffer) => void;
  const reading = new Promise<ArrayBuffer>(resolve => { finish = resolve; });
  vi.spyOn(input, "arrayBuffer").mockReturnValue(reading);
  const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:stale-image");
  const controller = new AbortController();
  const result = createValidatedCanvasImageUrl(input, controller.signal);
  controller.abort();
  finish(png().buffer as ArrayBuffer);
  await expect(result).rejects.toMatchObject({ name: "AbortError" });
  expect(create).not.toHaveBeenCalled();
});
