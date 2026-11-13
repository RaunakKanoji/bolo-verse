import { randomUUID } from "node:crypto";
import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { readMutationJson } from "@/server/auth/mutations";
import { SaveVideoEditorDraftSchema, videoEditorMaxBytes } from "@/lib/contracts/video-editor";
const request = (body: string) =>
  new Request("http://localhost/api/video-editor", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body,
  });
it("accepts a bounded multilingual video draft only with the explicit larger body budget", async () => {
  const document = {
    schemaVersion: 1,
    aspectRatio: "16:9",
    clips: [
      {
        id: randomUUID(),
        assetId: randomUUID(),
        startSeconds: 0,
        durationSeconds: 5,
        trimStartSeconds: 0,
        audioLevel: 1,
      },
    ],
    overlays: Array.from({ length: 50 }, () => ({
      id: randomUUID(),
      kind: "caption",
      text: "अ".repeat(500),
      startSeconds: 0,
      durationSeconds: 5,
      style: { color: "#ffffff", fontSize: 24, align: "center" },
    })),
  };
  const body = JSON.stringify({ expectedRevision: 0, document });
  expect(new TextEncoder().encode(body).byteLength).toBeGreaterThan(32768);
  expect(
    await readMutationJson(request(body), SaveVideoEditorDraftSchema, {
      maxBytes: videoEditorMaxBytes,
    }),
  ).toEqual({ expectedRevision: 0, document });
  await expect(readMutationJson(request(body), SaveVideoEditorDraftSchema)).rejects.toMatchObject({
    status: 413,
  });
});
it("bounds streamed video bodies without trusting a content length header", async () => {
  await expect(
    readMutationJson(request(" ".repeat(videoEditorMaxBytes + 1)), SaveVideoEditorDraftSchema, {
      maxBytes: videoEditorMaxBytes,
    }),
  ).rejects.toMatchObject({ status: 413 });
});
