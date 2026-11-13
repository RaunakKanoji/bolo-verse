import { describe, expect, it } from "vitest";
import {
  PublishDeliverableSchema,
  UploadedImageProvenanceSchema,
} from "@/lib/contracts/deliverables";
import { OutputSourceSnapshotSchema } from "@/lib/contracts/documents";
const id = "11111111-1111-4111-8111-111111111111";
const source = {
  schemaVersion: 2,
  sourceType: "uploaded_image",
  projectId: id,
  assetId: id,
  checksumSha256: "a".repeat(64),
  creatorId: "user_server",
  title: "Poster",
  caption: "",
  briefVersion: 1,
  sceneRevision: 3,
  sceneRelation: "context_only",
};
describe("uploaded publication contract", () => {
  it("accepts an exact revision binding and rejects partial or forged revision context", () => {
    const revision = { supersedesVersionId: id, expectedVersion: 1, expectedDecisionId: id };
    const input = { assetId: id, title: "Updated poster", idempotencyKey: id, revision };
    expect(PublishDeliverableSchema.parse(input).revision).toEqual(revision);
    expect(UploadedImageProvenanceSchema.parse({ ...source, revision }).revision).toEqual(revision);
    for (const invalid of [
      {},
      { ...revision, expectedVersion: 0 },
      { ...revision, reviewerId: "forged" },
      { ...revision, expectedDecisionId: "bad" },
    ]) {
      expect(PublishDeliverableSchema.safeParse({ ...input, revision: invalid }).success).toBe(
        false,
      );
    }
  });
  it("preserves an existing legacy v1 media-edit snapshot exactly", () => {
    const legacy = {
      schemaVersion: 1,
      sourceKind: "media_edit",
      briefVersionId: id,
      briefApprovalStatus: "proposed",
      assetIds: [id],
      mediaEditVersionId: id,
      edit: {
        schemaVersion: 1,
        aspectRatio: "1:1",
        clips: [
          {
            id,
            assetId: id,
            startSeconds: 0,
            durationSeconds: 1,
            trimStartSeconds: 0,
            audioLevel: 1,
          },
        ],
        overlays: [],
      },
    };
    expect(OutputSourceSnapshotSchema.parse(legacy)).toEqual(legacy);
  });
  it("keeps new provenance separate from strict legacy v1", () => {
    expect(UploadedImageProvenanceSchema.parse(source)).toEqual(source);
    expect(OutputSourceSnapshotSchema.safeParse(source).success).toBe(false);
    expect(UploadedImageProvenanceSchema.safeParse({ ...source, schemaVersion: 1 }).success).toBe(
      false,
    );
    for (const patch of [
      { renderedFromScene: true },
      { checksumSha256: "wrong" },
      { sceneRelation: "rendered_from" },
    ])
      expect(UploadedImageProvenanceSchema.safeParse({ ...source, ...patch }).success).toBe(false);
  });
  it("rejects identity/provenance injection and nonpositive source links", () => {
    const input = { assetId: id, title: " Poster ", idempotencyKey: id };
    expect(PublishDeliverableSchema.parse(input).title).toBe("Poster");
    for (const patch of [
      { creatorId: "forged" },
      { checksumSha256: "a".repeat(64) },
      { title: " " },
      { briefVersion: 0 },
      { sceneRevision: 0 },
      { caption: "x".repeat(1001) },
    ])
      expect(PublishDeliverableSchema.safeParse({ ...input, ...patch }).success).toBe(false);
  });
});
