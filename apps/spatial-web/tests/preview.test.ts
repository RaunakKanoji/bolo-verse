import { expect, it } from "vitest";
import { readPreviewBytes } from "../src/lib/preview";

it("rejects oversized, mismatched and redirected preview responses before decoding", async () => {
  await expect(readPreviewBytes(new Response(new Uint8Array(12), { headers: { "Content-Type": "model/gltf-binary" } }), "model/gltf-binary", 10)).rejects.toThrow(/limit/i);
  await expect(readPreviewBytes(new Response("text", { headers: { "Content-Type": "text/html" } }), "model/gltf-binary", 100)).rejects.toThrow(/type/i);
  const bytes = await readPreviewBytes(new Response(new Uint8Array([1, 2, 3]), { headers: { "Content-Type": "image/png" } }), "image/png", 10);
  expect([...bytes]).toEqual([1, 2, 3]);
});
