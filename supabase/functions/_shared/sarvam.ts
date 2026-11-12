// Sarvam AI client (STT + TTS). Skeleton in M0; real calls arrive in M2.
// Auth header is `api-subscription-key: <key>`, NOT `Authorization: Bearer`.

export const SARVAM_BASE = 'https://api.sarvam.ai';
// VERIFY (M2): exact endpoint paths, form field names and the code-mix mode parameter
// in https://docs.sarvam.ai before implementing.
export const SARVAM_STT_PATH = '/speech-to-text';
export const SARVAM_TTS_PATH = '/text-to-speech';
export const STT_MODEL = 'saaras:v3';
export const TTS_MODEL = 'bulbul:v3';

/** Headers for every Sarvam request. Throws if the secret is not set. */
export function sarvamHeaders(): Record<string, string> {
  const key = Deno.env.get('SARVAM_API_KEY');
  if (!key) throw new Error('SARVAM_API_KEY secret is not set');
  return { 'api-subscription-key': key };
}
