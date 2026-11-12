/**
 * Creative brief contract (CLAUDE.md "CURRENT PLAN" item 3). The `brief` Edge Function
 * returns exactly this shape; the compositor renders from it. Do not rename fields.
 */
import { z } from 'zod';

export const MOTIONS = ['push_in', 'pull_out', 'pan_left', 'pan_right', 'orbit'];
export const SPEEDS = ['slow', 'medium'];

export const GradeSchema = z
  .object({
    temperature: z.number().min(-1).max(1), // -1 cool … +1 warm
    brightness: z.number().min(0.5).max(1.5),
    contrast: z.number().min(0.8).max(1.3),
  })
  .strict();

export const BriefSchema = z
  .object({
    scene: z.string().max(200),
    lighting: z.string().max(200),
    mood: z.string().max(200),
    motion: z.enum(MOTIONS),
    speed: z.enum(SPEEDS),
    duration_s: z.number().int().min(5).max(15),
    background_prompt: z.string().max(600),
    grade: GradeSchema,
    confirm_text: z.string().max(200),
    confidence: z.number().min(0).max(1),
  })
  .strict();

/** Starting brief before the creator says anything. */
export const DEFAULT_BRIEF = Object.freeze({
  scene: 'studio',
  lighting: 'soft studio light',
  mood: 'clean',
  motion: 'push_in',
  speed: 'slow',
  duration_s: 8,
  background_prompt: 'seamless soft grey studio backdrop with a smooth floor, empty centre',
  grade: Object.freeze({ temperature: 0, brightness: 1, contrast: 1 }),
  confirm_text: '',
  confidence: 1,
});

/**
 * Validates raw brief JSON. Never throws.
 * @param {unknown} raw
 * @returns {{ ok: true, brief: object } | { ok: false, error: string }}
 */
export function parseBrief(raw) {
  const r = BriefSchema.safeParse(raw);
  return r.success ? { ok: true, brief: r.data } : { ok: false, error: r.error.message };
}

/**
 * Returns a new brief with `patch` applied (grade merged field by field).
 * Used by manual controls now, and by follow-up voice edits later.
 */
export function mergeBrief(brief, patch) {
  return { ...brief, ...patch, grade: { ...brief.grade, ...(patch.grade ?? {}) } };
}
