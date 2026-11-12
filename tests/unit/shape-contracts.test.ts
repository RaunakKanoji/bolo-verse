import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createEmptyCreativeDraftDocument, CreativeDraftDocumentSchema, CreativeDraftSnapshotSchema,
  SaveCreativeDraftSchema, ShapeApiSchemas, ShapeApiOperations,
} from "@/lib/contracts/shape";
import { getCreativeCapabilities } from "@/server/providers/creative-capabilities";

const projectId = "a0000000-0000-4000-8000-000000000001";

describe("Shape shared transport boundaries", () => {
  it("keeps independent prompts, including whitespace, without accepting ownership or executable settings", () => {
    const document = createEmptyCreativeDraftDocument();
    document.prompts.image = "  A considered composition  ";
    document.prompts.audio = "A quiet narration";
    expect(CreativeDraftDocumentSchema.parse(document)).toEqual(document);
    expect(CreativeDraftDocumentSchema.safeParse({ ...document, ownerId: "injected" }).success).toBe(false);
    expect(CreativeDraftDocumentSchema.safeParse({ ...document, prompts: { ...document.prompts, seed: "7" } }).success).toBe(false);
    expect(CreativeDraftDocumentSchema.safeParse({ ...document, prompts: { ...document.prompts, video: "x".repeat(2001) } }).success).toBe(false);
  });
  it("rejects invalid revision numbers and schema versions and requires nullable snapshot metadata", () => {
    const document = createEmptyCreativeDraftDocument();
    for (const expectedRevision of [-1, 0.1, Number.MAX_SAFE_INTEGER, Infinity]) {
      expect(SaveCreativeDraftSchema.safeParse({ expectedRevision, document }).success).toBe(false);
    }
    expect(CreativeDraftDocumentSchema.safeParse({ ...document, schemaVersion: 2 }).success).toBe(false);
    expect(CreativeDraftSnapshotSchema.safeParse({ projectId, revision: 0, document, canEdit: true }).success).toBe(false);
    expect(CreativeDraftSnapshotSchema.parse({ projectId, revision: 0, document, canEdit: true, updatedAt: null }).updatedAt).toBeNull();
  });
  it("never turns provider credentials into creative-generation availability", () => {
    vi.stubEnv("GEMINI_API_KEY", "configured-test-value");
    vi.stubEnv("SARVAM_API_KEY", "configured-test-value");
    const catalog = getCreativeCapabilities();
    expect(catalog.modes.map((mode) => mode.id)).toEqual(["image", "video", "audio", "model3d"]);
    for (const mode of catalog.modes) {
      expect(mode.availability).toBe("not_implemented");
      expect(mode.settings).toEqual([]);
      expect(mode.reason.length).toBeGreaterThan(10);
    }
    expect(JSON.stringify(catalog)).not.toContain("configured-test-value");
    vi.unstubAllEnvs();
  });
  it("publishes only implemented versioned JSON operations with resolvable schemas", () => {
    expect(ShapeApiOperations.length).toBeGreaterThan(5);
    for (const operation of ShapeApiOperations) {
      expect(operation.path).toMatch(/^\/api\/v1\//);
      expect(ShapeApiSchemas[operation.responseSchema]).toBeDefined();
      if ("requestSchema" in operation) expect(ShapeApiSchemas[operation.requestSchema]).toBeDefined();
    }
  });
});
