import { describe, expect, it } from "vitest";
import {
  CreativeActionSchema,
  parseCreativeAction,
  ProductionDraftSchema,
  applyLocalCreativeAction,
  productionDraftPrompt,
  productionDraftFromPrompt,
  buildProductionDraftSave,
} from "@/lib/contracts/creative-actions";
const id = "e67ea056-e196-445c-8c9b-55b2058a5d58";
describe("reviewed creation action grammar", () => {
  it.each([
    [`open asset ${id}`, { type: "OPEN_ASSET", assetId: id }],
    ["Create scene", { type: "CREATE_SCENE" }],
    ["Open the storyboard.", { type: "OPEN_STORYBOARD" }],
    ["Open storyboard", { type: "OPEN_STORYBOARD" }],
    ["Add text: A warm craft launch", { type: "ADD_TEXT", text: "A warm craft launch" }],
    ["Change duration to 15 seconds", { type: "CHANGE_DURATION", seconds: 15 }],
    ["Generate caption", { type: "GENERATE_CAPTION" }],
    ["Save draft", { type: "SAVE_DRAFT" }],
    ["Submit for review", { type: "SUBMIT_FOR_REVIEW" }],
  ])("proposes exactly one allowlisted action for %s", (text, want) =>
    expect(parseCreativeAction(text)).toEqual(want),
  );
  it.each([
    "",
    "Open https://evil.test",
    "Create scene and submit for review",
    "Open the storyboard and delete it",
    "Change duration to 0 seconds",
    "Change duration to 61 seconds",
    "Change duration to 1.5 seconds",
    "open asset other",
    "Generate caption and publish",
    "Add text: ",
    "x".repeat(2001),
  ])("rejects unknown, compound or invalid commands %s", (text) =>
    expect(parseCreativeAction(text)).toBeNull(),
  );
  it("rejects extra executable fields and validates bounded planning data", () => {
    expect(
      CreativeActionSchema.safeParse({ type: "CREATE_SCENE", url: "https://evil.test" }).success,
    ).toBe(false);
    expect(
      ProductionDraftSchema.safeParse({ text: "x".repeat(1801), durationSeconds: null }).success,
    ).toBe(false);
    expect(() =>
      applyLocalCreativeAction(
        { text: "x".repeat(1795), durationSeconds: null },
        { type: "ADD_TEXT", text: "too much text" },
      ),
    ).toThrow();
    expect(
      applyLocalCreativeAction(
        { text: "Existing", durationSeconds: null },
        { type: "ADD_TEXT", text: "New line" },
      ),
    ).toEqual({ text: "Existing\nNew line", durationSeconds: null });
  });
  it("saves actual video prompt with CAS while preserving other creative modes", () => {
    const draft = { text: "A craft launch", durationSeconds: 15 };
    const text = productionDraftPrompt(draft);
    expect(text).toContain("A craft launch");
    expect(text).toContain("planning target: 15 seconds");
    expect(text).toContain("media timing unchanged");
    expect(productionDraftFromPrompt(text)).toEqual(draft);
    const snapshot = {
      projectId: id,
      revision: 4,
      updatedAt: null,
      canEdit: true,
      document: {
        schemaVersion: 1 as const,
        mode: "image" as const,
        prompts: {
          image: "Keep image",
          video: "Previous video",
          audio: "Keep audio",
          model3d: "Keep 3D",
        },
      },
    };
    const save = buildProductionDraftSave(snapshot, draft);
    expect(save.expectedRevision).toBe(4);
    expect(save.document.mode).toBe("video");
    expect(save.document.prompts).toEqual({
      image: "Keep image",
      video: text,
      audio: "Keep audio",
      model3d: "Keep 3D",
    });
    expect(() => buildProductionDraftSave({ ...snapshot, canEdit: false }, draft)).toThrow();
  });
});
