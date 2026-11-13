import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  buildShotstackEdit,
  createShotstackProvider,
  getVideoEditorCapabilities,
} from "@/server/providers/shotstack";
import { parseServerEnv } from "@/server/config/env";
import type { MediaEditDocument } from "@/lib/contracts/documents";
import { documentToSdk } from "@/features/video/sdk-document";
const id = "d6000000-0000-4000-8000-000000000001";
const other = "d6000000-0000-4000-8000-000000000002";
const env = () =>
  parseServerEnv({
    ENABLE_EXTERNAL_EDITOR: "true",
    SHOTSTACK_API_KEY: "secret-key",
    SHOTSTACK_ENV: "sandbox",
    DATABASE_URL: "postgres://test",
    CLERK_SECRET_KEY: "secret",
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test",
    R2_ACCOUNT_ID: "a".repeat(32),
    R2_ACCESS_KEY_ID: "id",
    R2_SECRET_ACCESS_KEY: "secret",
    R2_BUCKET: "private",
  });
const source = {
  assetId: id,
  mimeType: "video/mp4",
  url: `https://${"a".repeat(32)}.r2.cloudflarestorage.com/private/video?X-Amz-Signature=secret`,
  durationSeconds: 10,
};
const edit: MediaEditDocument = {
  schemaVersion: 1,
  aspectRatio: "9:16",
  clips: [
    { id, assetId: id, startSeconds: 0, durationSeconds: 4, trimStartSeconds: 2, audioLevel: 0.5 },
  ],
  overlays: [
    {
      id: other,
      kind: "caption",
      text: "Hello <world>",
      startSeconds: 1,
      durationSeconds: 2,
      style: { color: "#ffffff", fontSize: 32, align: "left" },
    },
  ],
};
const reply = (response: unknown) => Response.json({ success: true, message: "OK", response });
const output = `https://shotstack-api-stage-output.s3-ap-southeast-2.amazonaws.com/owner/${id}.mp4`;
it("uses the same source fitting in browser preview and cloud output", () => {
  const preview = documentToSdk(
    edit,
    new Map([[id, { url: "blob:owned-source", mimeType: source.mimeType }]]),
  );
  const render = buildShotstackEdit(edit, [source]);
  expect(render.timeline.tracks.at(-1)?.clips[0]).toHaveProperty(
    "fit", preview.timeline.tracks.at(-1)?.clips[0].fit,
  );
});
it("maps text to top tracks, preserving explicit times, trim, fit, volume and aspect", () => {
  const json = buildShotstackEdit(edit, [source]);
  expect(json.timeline.tracks).toEqual([
    {
      clips: [
        {
          asset: {
            type: "rich-text",
            text: "Hello <world>",
            font: { family: "Open Sans", size: 32, color: "#ffffff" },
            align: { horizontal: "left", vertical: "bottom" },
          },
          start: 1,
          length: 2,
          position: "bottom",
        },
      ],
    },
    {
      clips: [
        {
          asset: { type: "video", src: source.url, trim: 2, volume: 0.5 },
          start: 0,
          length: 4,
          fit: "contain",
        },
      ],
    },
  ]);
  expect(json.output).toEqual({ format: "mp4", resolution: "hd", aspectRatio: "9:16" });
});
it("rejects unsupported timeline/source changes instead of dropping or clamping them", () => {
  for (const bad of [
    { ...edit, clips: [{ ...edit.clips[0], audioLevel: 1.5 }] },
    { ...edit, clips: [{ ...edit.clips[0], durationSeconds: 61 }] },
    { ...edit, clips: [edit.clips[0], { ...edit.clips[0], id: other, startSeconds: 1 }] },
  ])
    expect(() => buildShotstackEdit(bad, [source])).toThrow();
  expect(() => buildShotstackEdit(edit, [])).toThrow();
  expect(() => buildShotstackEdit(edit, [{ ...source, mimeType: "audio/wav" }])).toThrow();
  expect(() => buildShotstackEdit(edit, [{ ...source, durationSeconds: 5 }])).toThrow();
  expect(() =>
    buildShotstackEdit(edit, [{ ...source, url: "https://localhost/private" }]),
  ).toThrow();
});
it("reports disabled/configuration states without making a live-readiness claim", () => {
  expect(getVideoEditorCapabilities(parseServerEnv({})).availability).toBe("disabled");
  expect(getVideoEditorCapabilities({ ...env(), R2_BUCKET: undefined }).availability).toBe(
    "unconfigured",
  );
  expect(getVideoEditorCapabilities(env())).toMatchObject({
    availability: "configured",
    environment: "sandbox",
    maxDurationSeconds: 60,
  });
});
it("posts exactly once to fixed environment endpoint with a private header", async () => {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValue(reply({ id, message: "Render Successfully Queued" }));
  expect(
    await createShotstackProvider({ env: env(), fetcher }).submit({ edit, sources: [source] }),
  ).toEqual({ providerJobId: id });
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0]).toEqual([
    "https://api.shotstack.io/edit/stage/render",
    expect.objectContaining({
      method: "POST",
      redirect: "error",
      cache: "no-store",
      headers: { "x-api-key": "secret-key", "content-type": "application/json" },
      signal: expect.any(AbortSignal),
    }),
  ]);
  expect(JSON.parse(fetcher.mock.calls[0][1]!.body as string)).toEqual(
    buildShotstackEdit(edit, [source]),
  );
});
it.each([
  new Error("private credential"),
  new Response("secret", { status: 503 }),
  reply({ id: "invalid" }),
  new Response("{}", { headers: { "Content-Length": "999999" } }),
])(
  "marks ambiguous submission as uncertain without retry or provider error leakage",
  async (response) => {
    const fetcher = vi.fn<typeof fetch>();
    if (response instanceof Error) fetcher.mockRejectedValue(response);
    else fetcher.mockResolvedValue(response);
    await expect(
      createShotstackProvider({ env: env(), fetcher }).submit({ edit, sources: [source] }),
    ).rejects.toMatchObject({
      code: "SHOTSTACK_DISPATCH_UNCERTAIN",
      message: expect.not.stringContaining("private credential"),
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  },
);
it.each([
  ["queued", "queued"],
  ["fetching", "processing"],
  ["rendering", "processing"],
  ["saving", "processing"],
  ["failed", "failed"],
  ["done", "ready"],
])("maps provider status %s with bound job identity", async (status, expected) => {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValue(reply({ id, status, url: output, error: "private provider internals" }));
  const result = await createShotstackProvider({ env: env(), fetcher }).poll(id);
  expect(result.status).toBe(expected);
  if (status === "done") expect(result.outputUrl).toBe(output);
  if (status === "failed") expect(result.errorMessage).not.toContain("internals");
});
it.each([
  { id: other, status: "done", url: output },
  { id, status: "unknown" },
  { id, status: "done", url: "https://evil.amazonaws.com/file.mp4" },
  { id, status: "done", url: output.replace(id, other) },
])("refuses mismatched jobs or unsafe completed outputs", async (response) => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(reply(response));
  await expect(createShotstackProvider({ env: env(), fetcher }).poll(id)).rejects.toMatchObject({
    code: "SHOTSTACK_INVALID_RESPONSE",
  });
});
it("never dispatches while disabled or unconfigured, and maps production to v1", async () => {
  const fetcher = vi.fn<typeof fetch>();
  await expect(
    createShotstackProvider({ env: { ...env(), ENABLE_EXTERNAL_EDITOR: false }, fetcher }).submit({
      edit,
      sources: [source],
    }),
  ).rejects.toMatchObject({ code: "PROVIDER_UNCONFIGURED" });
  expect(fetcher).not.toHaveBeenCalled();
  fetcher.mockResolvedValue(reply({ id, message: "Render Successfully Queued" }));
  await createShotstackProvider({ env: { ...env(), SHOTSTACK_ENV: "production" }, fetcher }).submit(
    { edit, sources: [source] },
  );
  expect(fetcher.mock.calls[0][0]).toBe("https://api.shotstack.io/edit/v1/render");
});
it("requires an authorized resolver for legacy adapter submissions", async () => {
  const { createShotstackEditor } = await import("@/server/providers/shotstack");
  const fetcher = vi.fn<typeof fetch>();
  const adapter = createShotstackEditor({ env: env(), fetcher });
  await expect(
    adapter.submitRender({ projectId: id, mediaEditVersionId: id, idempotencyKey: other, edit }),
  ).rejects.toMatchObject({ code: "PROVIDER_UNCONFIGURED" });
  expect(fetcher).not.toHaveBeenCalled();
  expect(
    await adapter.validateEdit({ ...edit, clips: [{ ...edit.clips[0], audioLevel: 2 }] }),
  ).toMatchObject({ valid: false });
  expect(await adapter.validateEdit(edit)).toEqual({ valid: true });
});
