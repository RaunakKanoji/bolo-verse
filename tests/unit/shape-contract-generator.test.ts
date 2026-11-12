import { describe, expect, it } from "vitest";
import { generateModels } from "../../scripts/lib/contract-generator";

describe("language-neutral model generation", () => {
  it("refuses unsupported schema shapes rather than widening their types", () => {
    for (const schema of [{ type: "object", additionalProperties: { type: "string" } }, { oneOf: [{ type: "string" }, { type: "number" }] }, { type: "string", strangeKeyword: true }]) {
      expect(() => generateModels({ Bad: schema })).toThrow();
    }
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
