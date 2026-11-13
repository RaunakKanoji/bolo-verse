import { z } from "zod";
import { SaveCreativeDraftSchema, type CreativeDraftSnapshot } from "./shape";
const text = z.string().trim().min(1).max(1500);
/** A proposal is data. Only the creation widget's reviewed Apply handler may act on it. */
export const CreativeActionSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("OPEN_ASSET"), assetId: z.uuid() }),
  z.strictObject({ type: z.literal("CREATE_SCENE") }),
  z.strictObject({ type: z.literal("OPEN_STORYBOARD") }),
  z.strictObject({ type: z.literal("ADD_TEXT"), text }),
  z.strictObject({ type: z.literal("CHANGE_DURATION"), seconds: z.int().min(1).max(60) }),
  z.strictObject({ type: z.literal("GENERATE_CAPTION") }),
  z.strictObject({ type: z.literal("SAVE_DRAFT") }),
  z.strictObject({ type: z.literal("SUBMIT_FOR_REVIEW") }),
]);
export type CreativeAction = z.infer<typeof CreativeActionSchema>;
export const ProductionDraftSchema = z.strictObject({
  text: z.string().max(1800),
  durationSeconds: z.int().min(1).max(60).nullable(),
});
export type ProductionDraft = z.infer<typeof ProductionDraftSchema>;
export function parseCreativeAction(input: string): CreativeAction | null {
  if (input.length > 2000) return null;
  const command = input.trim();
  let value: unknown;
  if (/^create scene$/i.test(command)) value = { type: "CREATE_SCENE" };
  else if (/^open (?:the )?storyboard[.!]?$/i.test(command)) value = { type: "OPEN_STORYBOARD" };
  else if (/^generate caption$/i.test(command)) value = { type: "GENERATE_CAPTION" };
  else if (/^save draft$/i.test(command)) value = { type: "SAVE_DRAFT" };
  else if (/^submit for review$/i.test(command)) value = { type: "SUBMIT_FOR_REVIEW" };
  else {
    const asset = /^open asset ([a-f0-9-]{36})$/i.exec(command),
      duration = /^change duration(?: to)? ([0-9]{1,2}) seconds?$/i.exec(command),
      add = /^add text:\s*([\s\S]+)$/i.exec(command);
    if (asset) value = { type: "OPEN_ASSET", assetId: asset[1].toLowerCase() };
    else if (duration) value = { type: "CHANGE_DURATION", seconds: Number(duration[1]) };
    else if (add) value = { type: "ADD_TEXT", text: add[1] };
    else return null;
  }
  const parsed = CreativeActionSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
export function describeCreativeAction(action: CreativeAction): string {
  switch (action.type) {
    case "OPEN_ASSET":
      return `Open authorized asset ${action.assetId} from this project.`;
    case "CREATE_SCENE":
      return "Open this project's Spatial Studio to create or edit its scene.";
    case "OPEN_STORYBOARD":
      return "Open this project's saved text storyboard panel. No content is generated or changed.";
    case "ADD_TEXT":
      return `Add this text to the local production draft: ${action.text}`;
    case "CHANGE_DURATION":
      return `Set a planning target of ${action.seconds} seconds. Media timing is unchanged.`;
    case "GENERATE_CAPTION":
      return "Ask Gemini for a caption based on your production notes and linked saved brief. A provider request may incur a charge.";
    case "SAVE_DRAFT":
      return "Save these production notes to your private video prompt using the latest saved revision. Other creative modes are preserved.";
    case "SUBMIT_FOR_REVIEW":
      return "Open the project's Deliverables workflow. You must select a published version and reviewer there; opening it does not submit or share content.";
  }
}
export function applyLocalCreativeAction(
  current: ProductionDraft,
  input: Extract<CreativeAction, { type: "ADD_TEXT" | "CHANGE_DURATION" }>,
): ProductionDraft {
  const action = CreativeActionSchema.parse(input);
  return ProductionDraftSchema.parse(
    action.type === "ADD_TEXT"
      ? { ...current, text: [current.text, action.text].filter(Boolean).join("\n") }
      : action.type === "CHANGE_DURATION"
        ? { ...current, durationSeconds: action.seconds }
        : current,
  );
}
const planningPattern =
  /\n\n\[Production planning target: ([0-9]{1,2}) seconds; media timing unchanged\]$/;
export function productionDraftPrompt(input: ProductionDraft): string {
  const draft = ProductionDraftSchema.parse(input);
  return (
    draft.text +
    (draft.durationSeconds === null
      ? ""
      : `\n\n[Production planning target: ${draft.durationSeconds} seconds; media timing unchanged]`)
  );
}
export function productionDraftFromPrompt(prompt: string): ProductionDraft {
  const match = planningPattern.exec(prompt);
  return ProductionDraftSchema.parse({
    text: match ? prompt.slice(0, match.index) : prompt,
    durationSeconds: match ? Number(match[1]) : null,
  });
}
export function buildProductionDraftSave(snapshot: CreativeDraftSnapshot, draft: ProductionDraft) {
  if (!snapshot.canEdit) throw new Error("This project is read-only.");
  return SaveCreativeDraftSchema.parse({
    expectedRevision: snapshot.revision,
    document: {
      ...snapshot.document,
      mode: "video",
      prompts: { ...snapshot.document.prompts, video: productionDraftPrompt(draft) },
    },
  });
}
