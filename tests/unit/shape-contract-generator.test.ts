import { describe, expect, it } from "vitest";
import { generateModels } from "../../scripts/lib/contract-generator";

describe("language-neutral model generation", () => {
  it("represents an empty closed request as an empty record instead of the permissive TypeScript object type", () => {
    const result = generateModels({ EmptyRequest: { type: "object", properties: {}, additionalProperties: false } });
    expect(result.typescript).toContain("export type EmptyRequest = Record<string, never>;");
    expect(result.swift).toContain("public struct EmptyRequest");
  });
  it("refuses unsupported schema shapes rather than widening their types", () => {
    for (const schema of [{ type: "object", additionalProperties: { type: "string" } }, { oneOf: [{ type: "string" }, { type: "number" }] }, { type: "string", strangeKeyword: true }]) {
      expect(() => generateModels({ Bad: schema })).toThrow();
    }
  });
  it("generates exact numeric vector tuples and refuses heterogeneous or open tuples", () => {
    const vector = { type: "array", prefixItems: Array.from({ length: 3 }, () => ({ type: "number", minimum: -30, maximum: 30 })), items: false, minItems: 3, maxItems: 3 };
    const root = (position: object) => ({ VectorDocument: { type: "object", additionalProperties: false, required: ["position"], properties: { position } } });
    expect(generateModels(root(vector)).typescript).toContain("position: [number, number, number]");
    for (const invalid of [
      { ...vector, items: { type: "number" } }, { ...vector, maxItems: 4 },
      { ...vector, prefixItems: [{ type: "number" }, { type: "string" }, { type: "number" }] },
      { ...vector, prefixItems: Array.from({ length: 3 }, () => ({ type: "number", enum: [1, 2] })) },
    ]) expect(() => generateModels(root(invalid))).toThrow();
    // Tuple decoding constraints cannot be dropped through root/array typealiases.
    expect(() => generateModels({ Vector: vector })).toThrow();
    expect(() => generateModels({ Vectors: { type: "array", items: vector } })).toThrow();
  });
  it("rejects dangling references and unsafe schema/type names", () => {
    expect(() => generateModels({ Bad: { $ref: "#/components/schemas/Missing" } })).toThrow();
    expect(() => generateModels({ "Bad;import": { type: "string" } })).toThrow();
  });
});

import fixtures from "../../packages/api-contract/fixtures/roundtrip.json";
import { ShapeApiSchemas } from "@/lib/contracts/shape";
import { createShapeClient, ShapeApiError } from "../../packages/api-contract/generated/client";

describe("published transport fixtures", () => {
  it("conforms to actual server schemas including envelopes, nulls and safe integers", () => {
    for (const fixture of fixtures) {
      const schema = ShapeApiSchemas[fixture.schema as keyof typeof ShapeApiSchemas];
      expect(schema.parse(fixture.value)).toEqual(fixture.value);
    }
  });
  it("encodes path segments without allowing an identifier to become a route", async () => {
    const client = createShapeClient(async (input, init) => {
      expect(input).toBe("/api/v1/projects/a%2Fb%20%3F");
      expect(init?.credentials).toBe("same-origin");
      return Response.json({ ok: true, data: { project: {} }, requestId: "fixture" });
    });
    const result = await client.getProject("a/b ?");
    expect(result.requestId).toBe("fixture");
  });
  it("preserves revision/body and abort signal when saving, and surfaces HTTP errors", async () => {
    const controller = new AbortController();
    const document = { schemaVersion: 1 as const, mode: "audio" as const, prompts: { image: "", video: "", audio: "नमस्ते", model3d: "" } };
    const client = createShapeClient(async (_input, init) => {
      expect(init?.method).toBe("PUT");
      expect(init?.signal).toBe(controller.signal);
      expect(JSON.parse(String(init?.body))).toEqual({ expectedRevision: 4, document });
      return Response.json(fixtures[5].value, { status: 409 });
    });
    try {
      await client.saveCreativeDraft("project", { expectedRevision: 4, document }, controller.signal);
      expect.fail("Conflict must reject");
    } catch (error) {
      expect(error).toBeInstanceOf(ShapeApiError);
      expect((error as ShapeApiError).status).toBe(409);
      expect((error as ShapeApiError).payload).toEqual(fixtures[5].value);
    }
  });
});
