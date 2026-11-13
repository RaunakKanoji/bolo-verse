import { describe, expect, it } from "vitest";
import { BriefPayloadSchema } from "@/lib/contracts/documents";
import { SaveProjectBriefSchema, serializeBriefForAI } from "@/lib/contracts/project-briefs";

const legacy = { schemaVersion: 1, objective: "Launch", audience: "Shoppers", product: "Silk", format: "poster", aspectRatio: "1:1", tone: "Warm", language: "en-IN", facts: [], prohibitedClaims: [], constraints: [] };

describe("brief authoring payload", () => {
  it("serializes validated rich briefs deterministically regardless of property insertion order", () => {
    const brief = BriefPayloadSchema.parse({ ...legacy, notes: "Keep this context" });
    const reversed = Object.fromEntries(Object.entries(brief).reverse()) as typeof brief;
    expect(serializeBriefForAI(brief)).toBe(serializeBriefForAI(reversed));
    expect(JSON.parse(serializeBriefForAI(brief))).toEqual(brief);
    expect(() => serializeBriefForAI({ ...brief, objective: "" })).toThrow();
  });
  it("requires a bounded version, UUID retry key and no extra mutation fields", () => {
    const input = { brief: legacy, expectedVersion: 0, idempotencyKey: "b2000000-0000-4000-8000-000000000001" };
    expect(SaveProjectBriefSchema.safeParse(input).success).toBe(true);
    for (const extra of [{ expectedVersion: 2_147_483_647 }, { expectedVersion: 0.5 }, { idempotencyKey: "" }, { projectId: input.idempotencyKey }]) {
      expect(SaveProjectBriefSchema.safeParse({ ...input, ...extra }).success).toBe(false);
    }
  });
  it("rejects individually valid fields whose combined UTF-8 request exceeds 32 KiB", () => {
    const brief = { ...legacy, objective: "界".repeat(1000), audience: "界".repeat(1000), notes: "界".repeat(5000),
      brandRequirements: "界".repeat(2000), constraints: Array(20).fill("界".repeat(300)) };
    expect(BriefPayloadSchema.safeParse(brief).success).toBe(true);
    expect(SaveProjectBriefSchema.safeParse({ brief, expectedVersion: 0, idempotencyKey: "b2000000-0000-4000-8000-000000000001" }).success).toBe(false);
  });
  it("preserves rich legacy fields and accepts bounded authoring metadata", () => {
    expect(BriefPayloadSchema.parse(legacy)).toEqual(legacy);
    const payload = { ...legacy, title: "Client brief", brandRequirements: "Use approved logo", keyMessage: "Handwoven", channels: ["Instagram"], references: ["https://example.com/reference"], deadline: "2026-12-01", notes: "Discuss next week" };
    expect(BriefPayloadSchema.safeParse(payload).success).toBe(true);
  });
  it.each([
    { title: " " }, { title: "x".repeat(121) }, { notes: "x".repeat(5001) },
    { references: ["javascript:alert(1)"] }, { references: ["https://user:secret@example.com"] },
    { references: ["http://example.com"] }, { deadline: "2026-02-30" }, { deadline: "tomorrow" },
    { references: ["not a url"] },
    { creatorId: "foreign" }, { channels: Array(21).fill("social") },
  ])("rejects malformed authoring metadata %j", (extra) => {
    expect(BriefPayloadSchema.safeParse({ ...legacy, ...extra }).success).toBe(false);
  });
});
