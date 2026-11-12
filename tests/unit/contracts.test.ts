import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  apiResultSchema,
  CommandEnvelopeSchema,
  ArtifactPayloadSchema,
  ClaimIssueSchema,
  MediaEditDocumentSchema,
  OutputMetadataSchema,
  OutputSourceSnapshotSchema,
  StudioCommandSchema,
} from "../../src/lib/contracts";

const id = "9b25b4e8-3d0d-41d6-9e33-d94546392815";
const command = (action: string, params: unknown = {}) => ({
  action, params, confirm_text: "", reply_language: "en-IN",
});

describe("canonical v1 studio command boundary", () => {
  it.each([
    ["set_background", { name: "palace" }],
    ["rotate", { mode: "step", degrees: -45 }],
    ["rotate", { mode: "spin", speed: "slow" }],
    ["rotate", { mode: "stop" }],
    ["scale", { factor: 2 }],
    ["move", { direction: "closer" }],
    ["lighting", { preset: "golden_hour", brightness: 0.2 }],
    ["select_product", { productId: id }],
    ["select_product", { which: "next" }],
    ["name_product", { name: "Ilkal saree" }],
    ["set_brief", { facts: ["Silk-cotton blend"], banned_claims: ["Pure silk"] }],
    ["start_recording", {}],
    ["stop_recording", {}], ["reset_view", {}], ["undo", {}],
    ["repeat", {}], ["help", {}], ["none", {}], ["unknown", {}],
    ["set_language", { code: "kn-IN" }],
    ["set_voice_mode", { mode: "brainstorm" }],
    ["generate_directions", {}], ["pause_listening", {}],
  ])("accepts the specified %s command", (action, params) => {
    expect(StudioCommandSchema.safeParse(command(action as string, params)).success).toBe(true);
  });

  it("normalizes only documented defaults and trimmed names", () => {
    expect(StudioCommandSchema.parse(command("move", { direction: "left" })).params).toEqual({ direction: "left", meters: 0.15 });
    expect(StudioCommandSchema.parse(command("start_recording")).params).toEqual({ seconds: 15 });
    expect(StudioCommandSchema.parse(command("generate_directions")).params).toEqual({ count: 1 });
    expect(StudioCommandSchema.parse(command("name_product", { name: "  Ilkal  " })).params).toEqual({ name: "Ilkal" });
  });

  it.each([
    ["rotate", { mode: "step" }],
    ["rotate", { mode: "step", degrees: 46 }],
    ["rotate", { mode: "step", degrees: Infinity }],
    ["rotate", { mode: "spin", speed: "slow", degrees: 5 }],
    ["rotate", { mode: "stop", speed: "slow" }],
    ["scale", { factor: NaN }], ["scale", { factor: 0.49 }],
    ["scale", { factor: 2.01 }], ["scale", { factor: "1.2" }],
    ["move", { direction: "left", meters: 0.01 }],
    ["move", { direction: "left", meters: 0.51 }],
    ["lighting", { preset: "studio", brightness: 3 }],
    ["select_product", { productId: id, which: "next" }],
    ["select_product", {}],
    ["name_product", { name: "   " }],
    ["set_brief", { facts: Array(21).fill("fact"), banned_claims: [] }],
    ["set_brief", { facts: ["x".repeat(301)], banned_claims: [] }],
    ["start_recording", { seconds: 4 }], ["start_recording", { seconds: 31 }],
    ["start_recording", { seconds: 5.5 }],
    ["generate_directions", { count: 4 }],
    ["generate_directions", { request: "x".repeat(1001) }],
    ["set_voice_mode", { mode: "narration" }],
    ["undo", { targetId: id }], ["invented_action", {}],
  ])("rejects invalid %s parameters without coercing input", (action, params) => {
    expect(StudioCommandSchema.safeParse(command(action as string, params)).success).toBe(false);
  });

  it("rejects unknown keys and unbounded acknowledgement text", () => {
    expect(StudioCommandSchema.safeParse({ ...command("help"), credentials: "not-authority" }).success).toBe(false);
    expect(StudioCommandSchema.safeParse({ ...command("help"), confirm_text: "x".repeat(241) }).success).toBe(false);
    expect(StudioCommandSchema.safeParse({ ...command("help"), reply_language: "fr-FR" }).success).toBe(false);
  });

  it("requires application-owned version and concurrency metadata", () => {
    const envelope = { schemaVersion: 1, requestId: "retry-stable-id", sessionId: id, expectedRevision: 0, source: "ui", command: command("help") };
    expect(CommandEnvelopeSchema.safeParse(envelope).success).toBe(true);
    expect(CommandEnvelopeSchema.safeParse({ ...envelope, expectedRevision: -1 }).success).toBe(false);
    expect(CommandEnvelopeSchema.safeParse({ ...envelope, schemaVersion: 2 }).success).toBe(false);
    expect(CommandEnvelopeSchema.safeParse({ ...envelope, authorized: true }).success).toBe(false);
  });
});

describe("API and output foundations", () => {
  it("keeps success and failure envelopes mutually exclusive and validates data", () => {
    const schema = apiResultSchema(z.strictObject({ count: z.number().int() }));
    expect(schema.safeParse({ ok: true, data: { count: 1 }, requestId: "request-1" }).success).toBe(true);
    expect(schema.safeParse({ ok: true, data: { count: "1" }, requestId: "request-1" }).success).toBe(false);
    expect(schema.safeParse({ ok: false, error: { code: "FORBIDDEN", message: "Denied", retryable: false }, requestId: "request-1" }).success).toBe(true);
    expect(schema.safeParse({ ok: false, data: {}, error: { code: "FORBIDDEN", message: "Denied", retryable: false }, requestId: "request-1" }).success).toBe(false);
  });

  it("requires a frozen scene and immutable source references for a capture snapshot", () => {
    expect(OutputSourceSnapshotSchema.safeParse({ schemaVersion: 1, sceneRevision: 1, sessionId: id, briefVersionId: id }).success).toBe(false);
  });

  it("rejects generated scripts with no brief or direction revision binding", () => {
    const payload = { kind: "script", schemaVersion: 1, sections: [{ id, spokenText: "Handwoven in Ilkal", onScreenText: "Ilkal", durationSeconds: 5 }], callToAction: "Explore the collection" };
    expect(ArtifactPayloadSchema.safeParse(payload).success).toBe(false);
    expect(ArtifactPayloadSchema.safeParse({ ...payload, briefVersionId: id, directionVersionId: id }).success).toBe(true);
  });

  it("rejects URL clip sources and out-of-range audio levels in an edit", () => {
    const edit = { schemaVersion: 1, aspectRatio: "9:16", clips: [{ id, assetId: id, startSeconds: 0, durationSeconds: 5, trimStartSeconds: 0, audioLevel: 1 }], overlays: [] };
    expect(MediaEditDocumentSchema.safeParse(edit).success).toBe(true);
    expect(MediaEditDocumentSchema.safeParse({ ...edit, clips: [{ ...edit.clips[0], audioLevel: 3 }] }).success).toBe(false);
    expect(MediaEditDocumentSchema.safeParse({ ...edit, clips: [{ ...edit.clips[0], url: "https://example.com/video.mp4" }] }).success).toBe(false);
  });

  it("keeps actual media metadata explicit and claim offsets ordered", () => {
    expect(OutputMetadataSchema.safeParse({ format: "reel", mimeType: "video/webm", bytes: 1000, width: 720, height: 1280, durationSeconds: 15 }).success).toBe(true);
    expect(OutputMetadataSchema.safeParse({ format: "reel", mimeType: "video/webm", bytes: 0, width: 720, height: 1280, durationSeconds: 15 }).success).toBe(false);
    expect(ClaimIssueSchema.safeParse({ claim: "Pure silk", transcriptSpan: { start: 10, end: 5 }, verdict: "contradicts", factIds: [id], explanation: "Brief says blend" }).success).toBe(false);
  });
});
