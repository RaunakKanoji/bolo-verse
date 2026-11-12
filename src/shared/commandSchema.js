/**
 * Command JSON contract (§6). Shared by the studio, the /command Edge Function
 * and teammates' code. Do not rename actions or params.
 */
import { z } from 'zod';

export const ACTIONS = [
  'set_background', 'rotate', 'scale', 'move', 'lighting', 'select_product', 'name_product',
  'set_brief', 'start_recording', 'stop_recording', 'reset_view', 'undo', 'repeat', 'help',
  'set_language', 'none', 'unknown',
];

export const LanguageCode = z.enum(['en-IN', 'hi-IN', 'kn-IN']);
const empty = z.object({});

/** Params schema for each action. */
export const PARAMS = {
  set_background: z.object({ name: z.enum(['palace', 'beach', 'studio', 'market']) }),
  rotate: z.object({
    mode: z.enum(['spin', 'stop', 'turn']),
    degrees: z.number().optional(),
    direction: z.enum(['left', 'right']).optional(),
    speed: z.enum(['slow', 'fast']).optional(),
  }),
  scale: z.object({ factor: z.number().positive() }),
  move: z.object({ direction: z.enum(['up', 'down', 'left', 'right', 'closer', 'farther']) }),
  lighting: z.object({
    preset: z.enum(['golden_hour', 'studio', 'dramatic', 'soft']),
    brightness: z.number().min(0.2).max(2).optional(),
  }),
  select_product: z.object({ which: z.string().min(1) }), // "next" | "previous" | "latest" | <name>
  name_product: z.object({ name: z.string().min(1).max(80) }),
  set_brief: z.object({
    facts: z.array(z.string()).default([]),
    banned_claims: z.array(z.string()).default([]),
  }),
  start_recording: z.object({ seconds: z.number().int().min(5).max(30).default(15) }),
  stop_recording: empty,
  reset_view: empty,
  undo: empty,
  repeat: empty,
  help: empty,
  set_language: z.object({ code: LanguageCode }),
  none: empty,
  unknown: empty,
};

const base = {
  confirm_text: z.string().max(120),
  confidence: z.number().min(0).max(1),
  reply_language: LanguageCode,
};

/** Full command schema: a discriminated union on `action`. */
export const CommandSchema = z.discriminatedUnion(
  'action',
  ACTIONS.map((action) =>
    z.object({ action: z.literal(action), params: PARAMS[action].default({}), ...base }),
  ),
);

/**
 * Validates raw command JSON. Never throws.
 * @param {unknown} raw
 * @returns {{ ok: true, command: object } | { ok: false, error: string }}
 */
export function parseCommand(raw) {
  const r = CommandSchema.safeParse(raw);
  return r.success ? { ok: true, command: r.data } : { ok: false, error: r.error.message };
}
