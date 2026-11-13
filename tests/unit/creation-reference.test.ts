import { afterEach, expect, it, vi } from "vitest";
import { uploadReferenceImage, uploadProjectImage } from "@/features/creation/upload-reference-image";
const id = "e67ea056-e196-445c-8c9b-55b2058a5d58";
afterEach(() => vi.unstubAllGlobals());
it("validates local media before reserving or sending private image bytes", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  await expect(
    uploadReferenceImage(
      id,
      new File(["not an image"], "private.svg", { type: "image/svg+xml" }),
      new AbortController().signal,
    ),
  ).rejects.toThrow("PNG");
  expect(fetcher).not.toHaveBeenCalled();
});

it("uploads checked bytes with a checksum and only returns a finalized authorized asset", async () => {
  const bytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j7M0AAAAASUVORK5CYII=",
    "base64",
  );
  const file = new File([bytes], "reference.png", { type: "image/png" });
  const assetId = "a046df5a-e5e4-4727-a191-2266e031bba9";
  const calls: { url: string; options: RequestInit }[] = [];
  vi.stubGlobal("fetch", async (url: string, options: RequestInit) => {
    calls.push({ url, options });
    const data = url.includes("/finalize")
      ? {
          asset: {
            id: assetId,
            projectId: id,
            mimeType: "image/png",
            byteSize: bytes.length,
            width: 1,
            height: 1,
            durationSeconds: null,
            createdAt: "2026-11-12T10:00:00.000Z",
            nativeContentUrl: null,
            contentUrl: `/api/v1/assets/${assetId}/content`,
          },
        }
      : {
          upload: {
            id,
            projectId: id,
            assetId,
            expiresAt: "2026-11-12T10:05:00.000Z",
            uploadUrl: "https://storage.example.test/upload",
            uploadContentType: "image/png",
          },
        };
    return url.startsWith("https:")
      ? new Response(null)
      : new Response(JSON.stringify({ ok: true, data, requestId: "test" }));
  });
  await expect(uploadReferenceImage(id, file, new AbortController().signal)).resolves.toBe(assetId);
  expect(calls).toHaveLength(3);
  expect(JSON.parse(calls[0].options.body as string)).toMatchObject({
    projectId: id,
    fileName: "reference.png",
    byteSize: bytes.length,
    checksumSha256: expect.stringMatching(/^[0-9a-f]{64}$/),
  });
  expect(calls[1].options).toMatchObject({
    method: "PUT",
    body: file,
    credentials: "omit",
    headers: { "Content-Type": "image/png", "If-None-Match": "*" },
  });
  expect(calls[1].options.headers).toEqual({ "Content-Type": "image/png", "If-None-Match": "*" });
  expect(calls[2].url).toBe(`/api/v1/assets/upload-session/${id}/finalize`);
});

it("rejects references over the provider 10 MiB limit before reading or uploading bytes", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  const file = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "oversized.png", {
    type: "image/png",
  });
  const read = vi.spyOn(file, "arrayBuffer");
  await expect(uploadReferenceImage(id, file, new AbortController().signal)).rejects.toThrow(
    "10 MiB",
  );
  expect(read).not.toHaveBeenCalled();
  expect(fetcher).not.toHaveBeenCalled();
});

it("reuses a project upload key and verifies an already-written staging object on retry", async () => {
  const bytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j7M0AAAAASUVORK5CYII=", "base64");
  const file = new File([bytes], "poster.png", { type: "image/png" });
  const assetId = "a046df5a-e5e4-4727-a191-2266e031bba9";
  const keys: string[] = [], phases: string[] = [];
  let finalizeCalls = 0;
  vi.stubGlobal("fetch", async (url: string, options: RequestInit) => {
    if (url.startsWith("https:")) return new Response(null, { status: 412 });
    if (url.endsWith("/finalize")) {
      if (++finalizeCalls === 1) throw new TypeError("connection interrupted");
      return Response.json({ ok: true, data: { asset: { id: assetId, projectId: id, mimeType: "image/png", byteSize: bytes.length, width: 1, height: 1, durationSeconds: null, createdAt: "2026-11-12T10:00:00.000Z", nativeContentUrl: null, contentUrl: `/api/v1/assets/${assetId}/content` } }, requestId: "test" });
    }
    keys.push(JSON.parse(options.body as string).idempotencyKey);
    return Response.json({ ok: true, data: { upload: { id, assetId, projectId: id, expiresAt: "2026-11-13T10:00:00.000Z", uploadUrl: "https://storage.example.test/scoped", uploadContentType: "image/png" } }, requestId: "test" });
  });
  const options = { idempotencyKey: id, onPhase: (phase: string) => phases.push(phase) };
  await expect(uploadProjectImage(id, file, new AbortController().signal, options)).rejects.toThrow();
  await expect(uploadProjectImage(id, file, new AbortController().signal, options)).resolves.toMatchObject({ id: assetId, projectId: id });
  expect(keys).toEqual([id, id]);
  expect(phases.slice(-4)).toEqual(["preparing", "reserving", "uploading", "verifying"]);
});

it("bounds project images at 20 MiB before reading bytes", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  const file = new File([new Uint8Array(20 * 1024 * 1024 + 1)], "large.png", { type: "image/png" });
  await expect(uploadProjectImage(id, file, new AbortController().signal, { idempotencyKey: id })).rejects.toThrow("20 MiB");
  expect(fetcher).not.toHaveBeenCalled();
});

it("rejects a foreign finalized asset even when the server response shape is valid", async () => {
  const bytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j7M0AAAAASUVORK5CYII=", "base64");
  const assetId = "a046df5a-e5e4-4727-a191-2266e031bba9";
  vi.stubGlobal("fetch", async (url: string) => {
    if (url.startsWith("https:")) return new Response(null);
    const data = url.endsWith("/finalize") ? { asset: { id: assetId, projectId: assetId, mimeType: "image/png", byteSize: bytes.length, width: 1, height: 1, durationSeconds: null, createdAt: "2026-11-12T10:00:00.000Z", nativeContentUrl: null, contentUrl: `/api/v1/assets/${assetId}/content` } } : { upload: { id, projectId: id, assetId, expiresAt: "2026-11-13T10:00:00.000Z", uploadUrl: "https://storage.example.test/scoped", uploadContentType: "image/png" } };
    return Response.json({ ok: true, data, requestId: "test" });
  });
  await expect(uploadProjectImage(id, new File([bytes], "poster.png", { type: "image/png" }), new AbortController().signal, { idempotencyKey: id })).rejects.toThrow(/belong/);
});
