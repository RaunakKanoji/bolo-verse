// Gemini client (command understanding + claim check). Skeleton in M0; real calls arrive in M2/M6.
// The model name comes from the GEMINI_MODEL secret (a current free-tier Flash model).

// VERIFY (M2): REST path, `generationConfig.responseMimeType` / `responseSchema` field names
// and the API-key header in https://ai.google.dev/api before implementing.
export const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

/** Returns { key, model } from secrets. Throws if either is missing. */
export function geminiConfig(): { key: string; model: string } {
  const key = Deno.env.get('GEMINI_API_KEY');
  const model = Deno.env.get('GEMINI_MODEL');
  if (!key || !model) throw new Error('GEMINI_API_KEY / GEMINI_MODEL secrets are not set');
  return { key, model };
}
