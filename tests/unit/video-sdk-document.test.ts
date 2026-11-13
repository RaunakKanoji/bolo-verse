import { describe, expect, it } from "vitest";
import { documentToSdk, documentFromSdk } from "@/features/video/sdk-document";
import type { VideoEditorDocument } from "@/lib/contracts/video-editor";
const assetId = "e67ea056-e196-445c-8c9b-55b2058a5d58";
const document: VideoEditorDocument = {
  schemaVersion: 1,
  aspectRatio: "16:9",
  clips: [
    {
      id: "a046df5a-e5e4-4727-a191-2266e031bba9",
      assetId,
      startSeconds: 0,
      durationSeconds: 5,
      trimStartSeconds: 2,
      audioLevel: 0.5,
    },
  ],
  overlays: [
    {
      id: "65e9a873-d8a9-4914-9b2b-6396df71e42f",
      kind: "caption",
      text: "Private title",
      startSeconds: 1,
      durationSeconds: 3,
      style: { color: "#ffffff", fontSize: 32, align: "center" },
    },
  ],
};
const sources = new Map([[assetId, { url: "blob:private-source", mimeType: "video/webm" }]]);
describe("bounded Shotstack runtime projection", () => {
  it("keeps source blobs ephemeral and round trips trim, volume and caption identity", () => {
    const sdk = documentToSdk(document, sources);
    expect(sdk.timeline.tracks.at(-1)?.clips[0].asset).toMatchObject({
      type: "video",
      src: "blob:private-source",
      trim: 2,
      volume: 0.5,
    });
    const result = documentFromSdk(sdk, document, sources);
    expect(result).toEqual(document);
    expect(JSON.stringify(result)).not.toContain("blob:");
  });
  it("accepts valid timeline drags and rejects overlapping or out of bounds source changes", () => {
    const sdk = documentToSdk(document, sources);
    sdk.timeline.tracks.at(-1)!.clips[0].start = 10;
    expect(documentFromSdk(sdk, document, sources).clips[0].startSeconds).toBe(10);
    sdk.timeline.tracks.at(-1)!.clips[0].start = 59;
    expect(() => documentFromSdk(sdk, document, sources)).toThrow();
  });
  it.each(["effect", "transition", "offset", "scale", "filter"])(
    "fails closed instead of dropping unsupported %s changes",
    (key) => {
      const sdk = documentToSdk(document, sources);
      Object.assign(sdk.timeline.tracks.at(-1)!.clips[0], { [key]: key === "scale" ? 2 : {} });
      expect(() => documentFromSdk(sdk, document, sources)).toThrow(/unsupported/i);
    },
  );
  it("rejects arbitrary sources, custom font changes, destinations and missing asset identities", () => {
    for (const change of [
      (sdk: ReturnType<typeof documentToSdk>) => {
        Object.assign(sdk.timeline.tracks.at(-1)!.clips[0].asset, {
          src: "https://evil.test/private.mp4",
        });
      },
      (sdk: ReturnType<typeof documentToSdk>) => {
        Object.assign(sdk.output, { destinations: [] });
      },
      (sdk: ReturnType<typeof documentToSdk>) => {
        Object.assign(sdk.timeline.tracks[0].clips[0].asset, { font: { family: "Unapproved" } });
      },
    ]) {
      const sdk = documentToSdk(document, sources);
      change(sdk);
      expect(() => documentFromSdk(sdk, document, sources)).toThrow();
    }
    expect(() => documentToSdk(document, new Map())).toThrow(/source/i);
  });
});
