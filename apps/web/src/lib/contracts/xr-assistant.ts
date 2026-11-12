import { z } from "zod";
import { LanguageSchema } from "./api";

// Fits beneath the deployment's buffered request limit, including headers.
export const XR_SPEECH_MAX_BYTES = 4 * 1024 * 1024;

export const XRCommandSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("OPEN_ASSET"), assetId: z.uuid() }),
  z.strictObject({ type: z.literal("FOCUS_PANEL"), panelId: z.string().min(1).max(80) }),
  z.strictObject({ type: z.literal("RESET_WORKSPACE") }),
  z.strictObject({ type: z.literal("GENERATE_IDEAS"), projectId: z.uuid() }),
]);
export type XRCommand = z.infer<typeof XRCommandSchema>;
export const XRAssistantRequestSchema = z.strictObject({
  message: z.string().trim().min(1).max(2000),
  language: LanguageSchema,
});
export const XRSpeakRequestSchema = z.strictObject({
  text: z.string().trim().min(1).max(1500),
  language: LanguageSchema,
});
export const XRAssistantContentSchema = z.strictObject({
  reply: z.string().trim().min(1).max(6000),
  commands: z.array(XRCommandSchema).max(4),
});
export const XRAssistantResponseSchema = XRAssistantContentSchema.extend({
  mode: z.enum(["live", "development-mock"]),
});
export type XRAssistantResponse = z.infer<typeof XRAssistantResponseSchema>;
export const XRAssistantReadinessSchema = z.strictObject({
  mode: z.enum(["live", "development-mock", "unconfigured"]),
  textAvailable: z.boolean(),
  sttAvailable: z.boolean(),
  ttsAvailable: z.boolean(),
  message: z.string().max(500),
});
export type XRAssistantReadiness = z.infer<typeof XRAssistantReadinessSchema>;
export const XRTranscriptionSchema = z.strictObject({
  text: z.string().trim().min(1).max(2000),
  language: LanguageSchema,
  mode: z.literal("live"),
});
export type XRAssistantContext = {
  projectId: string;
  name: string;
  objective: string;
  content: string;
  panelIds: string[];
  assetIds: string[];
};

/** Validate both the command shape and the exact authorized resource set. */
export function validateAssistantCommands(
  input: unknown,
  context: Pick<XRAssistantContext, "projectId" | "panelIds" | "assetIds">,
): XRCommand[] {
  const commands = z.array(XRCommandSchema).max(4).parse(input);
  for (const command of commands) {
    if (command.type === "OPEN_ASSET" && !context.assetIds.includes(command.assetId))
      throw new Error("Unknown asset command.");
    if (command.type === "FOCUS_PANEL" && !context.panelIds.includes(command.panelId))
      throw new Error("Unknown panel command.");
    if (command.type === "GENERATE_IDEAS" && command.projectId !== context.projectId)
      throw new Error("Unknown project command.");
  }
  return commands;
}
