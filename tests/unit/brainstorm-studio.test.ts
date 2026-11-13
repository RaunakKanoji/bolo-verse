import { describe, expect, it } from "vitest";
import {
  CreateBrainstormSessionSchema,
  SendBrainstormMessageSchema,
  SaveBrainstormIdeaSchema,
  BrainstormStudioContentSchema,
} from "@/lib/contracts/brainstorm-studio";
const id = "a1000000-0000-4000-8000-000000000001";
describe("private persistent brainstorm contracts", () => {
  it("bounds requests and rejects browser-supplied identity, history and tool execution", () => {
    expect(
      CreateBrainstormSessionSchema.safeParse({ idempotencyKey: id, title: "Launch" }).success,
    ).toBe(true);
    for (const extra of [
      { ownerClerkId: "other" },
      { workspaceId: id },
      { history: [] },
      { commands: [] },
    ])
      expect(
        CreateBrainstormSessionSchema.safeParse({ idempotencyKey: id, title: "Launch", ...extra })
          .success,
      ).toBe(false);
    expect(
      SendBrainstormMessageSchema.safeParse({
        idempotencyKey: id,
        expectedRevision: 0,
        message: "Help",
      }).success,
    ).toBe(true);
    for (const message of [" ", "x".repeat(2001)])
      expect(
        SendBrainstormMessageSchema.safeParse({ idempotencyKey: id, expectedRevision: 0, message })
          .success,
      ).toBe(false);
  });
  it("requires reviewed bounded ideas and validates creative structures without executable actions", () => {
    expect(
      SaveBrainstormIdeaSchema.safeParse({
        idempotencyKey: id,
        expectedRevision: 0,
        title: "Craft",
        description: "Show the weave",
        tags: ["campaign"],
        category: "concept",
      }).success,
    ).toBe(true);
    expect(
      SaveBrainstormIdeaSchema.safeParse({
        idempotencyKey: id,
        expectedRevision: 0,
        title: "Craft",
        description: "Weave",
        tags: Array(9).fill("x"),
        category: "concept",
      }).success,
    ).toBe(false);
    expect(
      BrainstormStudioContentSchema.safeParse({
        reply: "Suggestions",
        concepts: [
          {
            title: "Craft",
            targetAudience: "Shoppers",
            coreMessage: "Made with care",
            contentFormat: "Video",
            creativeDirection: "Warm close-ups",
            productionRequirements: ["Camera"],
            nextSteps: ["Plan shots"],
          },
        ],
      }).success,
    ).toBe(true);
    expect(
      BrainstormStudioContentSchema.safeParse({
        reply: "Suggestions",
        concepts: [],
        commands: [{ type: "RESET_WORKSPACE" }],
      }).success,
    ).toBe(false);
  });
});
