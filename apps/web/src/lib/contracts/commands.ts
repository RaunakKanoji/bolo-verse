import { z } from "zod";
import { LanguageSchema, RequestIdSchema, ResourceIdSchema } from "./api";

export const BackgroundSchema = z.enum(["studio", "palace", "beach", "market"]);
export const LightingPresetSchema = z.enum(["studio", "golden_hour", "dramatic", "soft"]);
const empty = z.strictObject({});
const shortFact = z.string().max(300);

function command<const A extends string, P extends z.ZodType>(action: A, params: P) {
  return z.strictObject({
    action: z.literal(action),
    params,
    // Aim for eight spoken words; use a language-independent hard length bound.
    confirm_text: z.string().trim().max(240),
    reply_language: LanguageSchema,
  });
}

// This validates proposals only. The dispatcher must enforce authorization,
// target capabilities, recorder state, total transform bounds and revision checks.
export const StudioCommandSchema = z.discriminatedUnion("action", [
  command("set_background", z.strictObject({ name: BackgroundSchema })),
  command("rotate", z.discriminatedUnion("mode", [
    z.strictObject({ mode: z.literal("step"), degrees: z.number().finite().min(-45).max(45) }),
    z.strictObject({ mode: z.literal("spin"), speed: z.enum(["slow", "fast"]) }),
    z.strictObject({ mode: z.literal("stop") }),
  ])),
  command("scale", z.strictObject({ factor: z.number().finite().min(0.5).max(2) })),
  command("move", z.strictObject({
    direction: z.enum(["left", "right", "up", "down", "closer", "farther"]),
    meters: z.number().finite().min(0.05).max(0.5).default(0.15),
  })),
  command("lighting", z.strictObject({
    preset: LightingPresetSchema,
    brightness: z.number().finite().min(0.2).max(2).optional(),
  })),
  command("select_product", z.union([
    z.strictObject({ productId: ResourceIdSchema }),
    z.strictObject({ which: z.enum(["next", "previous"]) }),
  ])),
  command("name_product", z.strictObject({ name: z.string().trim().min(1).max(100) })),
  command("set_brief", z.strictObject({ facts: z.array(shortFact).max(20), banned_claims: z.array(shortFact).max(20) })),
  command("start_recording", z.strictObject({ seconds: z.number().int().min(5).max(30).default(15) })),
  command("stop_recording", empty),
  command("reset_view", empty),
  command("undo", empty),
  command("repeat", empty),
  command("help", empty),
  command("set_language", z.strictObject({ code: LanguageSchema })),
  command("none", empty),
  command("unknown", empty),
  command("set_voice_mode", z.strictObject({ mode: z.enum(["command", "brainstorm"]) })),
  command("generate_directions", z.strictObject({
    count: z.number().int().min(1).max(3).default(1),
    request: z.string().trim().max(1000).optional(),
  })),
  command("pause_listening", empty),
]);
export type StudioCommand = z.infer<typeof StudioCommandSchema>;

export const CommandEnvelopeSchema = z.strictObject({
  schemaVersion: z.literal(1),
  requestId: RequestIdSchema,
  sessionId: ResourceIdSchema,
  expectedRevision: z.number().int().nonnegative(),
  targetId: ResourceIdSchema.optional(),
  source: z.enum(["voice", "ui"]),
  command: StudioCommandSchema,
});
export type CommandEnvelope = z.infer<typeof CommandEnvelopeSchema>;
