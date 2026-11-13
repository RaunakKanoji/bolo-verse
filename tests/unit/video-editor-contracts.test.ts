import { describe, expect, it } from "vitest";
import { SaveVideoEditorDraftSchema, CreateVideoRenderSchema } from "@/lib/contracts/video-editor";
const id = "11111111-1111-4111-8111-111111111111";
const clip = {
  id,
  assetId: id,
  startSeconds: 0,
  durationSeconds: 5,
  trimStartSeconds: 0,
  audioLevel: 1,
};
const document = { schemaVersion: 1, aspectRatio: "16:9", clips: [clip], overlays: [] };
describe("bounded private video editing contracts", () => {
  it("preserves v1 asset IDs and rejects URL, duplicate, overlapping or excessive timelines", () => {
    expect(SaveVideoEditorDraftSchema.safeParse({ expectedRevision: 0, document }).success).toBe(
      true,
    );
    for (const clips of [
      [{ ...clip, src: "https://example.com/file" }],
      [{ ...clip, durationSeconds: 61 }],
      [clip, { ...clip, id: "22222222-2222-4222-8222-222222222222", startSeconds: 4 }],
      [clip, { ...clip, startSeconds: 5 }],
      [{ ...clip, trimStartSeconds: 601 }],
      [{ ...clip, audioLevel: 1.5 }],
    ]) {
      expect(
        SaveVideoEditorDraftSchema.safeParse({
          expectedRevision: 0,
          document: { ...document, clips },
        }).success,
      ).toBe(false);
    }
  });
  it("requires saved revision, UUID idempotency and exact explicit consent", () => {
    const input = { idempotencyKey: id, draftRevision: 1, consent: "shotstack-render-v1" };
    expect(CreateVideoRenderSchema.safeParse(input).success).toBe(true);
    for (const change of [
      { draftRevision: 0 },
      { consent: "yes" },
      { idempotencyKey: "retry" },
      { url: "https://example.com" },
    ])
      expect(CreateVideoRenderSchema.safeParse({ ...input, ...change }).success).toBe(false);
  });
});
