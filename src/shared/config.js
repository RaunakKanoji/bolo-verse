/**
 * BoloVerse shared constants. Every timeout, threshold, colour and feature flag
 * lives here so it can be tuned in one place.
 */

/** Frontend env (public values only, never secrets). */
export const ENV = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  FUNCTIONS_URL:
    import.meta.env.VITE_FUNCTIONS_URL ||
    (import.meta.env.VITE_SUPABASE_URL ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1` : ''),
};

/** Edge Function names (must match supabase/functions/<name>). `brief` and `background` arrive in B/C. */
export const FUNCTIONS = ['stt', 'tts'];

/** Timeouts in ms. */
export const TIMEOUTS = {
  stt: 6000,
  brief: 8000,
  tts: 5000,
  background: 20000, // > 20 s → fall back to a preloaded background
  default: 8000,
  realtimeConnect: 5000,
  /** Inference only; the model download (first visit) is not counted. */
  cutout: 90000,
};

/**
 * Background-removal model. isnet_quint8 = 44 MB download (phone friendly),
 * isnet_fp16 = 88 MB (library default, slightly cleaner edges).
 */
export const CUTOUT = { model: 'isnet_quint8', maxInputPx: 1024 };

/** Output video (portrait reel). */
export const VIDEO = { width: 720, height: 1280, fps: 30, bitrate: 4_000_000 };

/** Composition layout (fractions of the frame). */
export const LAYOUT = {
  productHeight: 0.55, // product fits ~55% of frame height…
  productMaxWidth: 0.82, // …unless that would be wider than this
  baseY: 0.86, // product's bottom edge sits here (centred low)
  bgOversize: 1.22, // background drawn larger than the frame so motion never shows edges
  parallax: 0.6, // background moves at 0.6× the product's rate
  bgGradeStrength: 1, // grade strength on the background…
  productGradeStrength: 0.6, // …slightly weaker on the product
  grainAlpha: 0.06,
};

/** Upload size limits in bytes. */
export const LIMITS = { image: 15 * 1024 * 1024, audio: 1024 * 1024, reel: 25 * 1024 * 1024 };

export const LANGUAGES = ['en-IN', 'hi-IN', 'kn-IN'];

/** Confidence below this → ask "Did you mean …?" before generating (B). */
export const CONFIRM_BELOW = 0.6;

/** Brand colours (§16). Only these in the UI. */
export const COLORS = { ink: '#05070d', white: '#f2f5fb', cobalt: '#3b74ff', pale: '#8fb6ff' };

export const DEBUG = true;
export const LOG_PREFIX = '[BoloVerse]';
