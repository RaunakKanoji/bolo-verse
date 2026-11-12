/**
 * BoloVerse shared constants. Every timeout, threshold, colour and feature flag
 * lives here so it can be tuned during the hackathon in one place.
 */

/** Frontend env (public values only, never secrets). */
export const ENV = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  FUNCTIONS_URL:
    import.meta.env.VITE_FUNCTIONS_URL ||
    (import.meta.env.VITE_SUPABASE_URL ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1` : ''),
};

/** Edge Function names (must match supabase/functions/<name>). */
export const FUNCTIONS = ['join-session', 'stt', 'command', 'tts', 'claimcheck', 'reel-link'];

/** Timeouts in ms (§8.3, §8.5, §9). */
export const TIMEOUTS = {
  stt: 6000,
  command: 6000,
  tts: 5000,
  default: 8000,
  realtimeConnect: 5000,
  confirmAnswer: 6000,
  backgroundRemoval: 15000,
  depth: 10000,
};

export const POLL_INTERVAL_MS = 2000;
export const FALLBACK_RETRY_MS = 60000;
export const FAILURES_BEFORE_FALLBACK = 2;
export const SCENE_STATE_DEBOUNCE_MS = 150;
export const UNDO_LIMIT = 10;

/** Voice clip length limits in seconds (§8.3). */
export const CLIP_MIN_S = 0.4;
export const CLIP_MAX_S = 12;
export const TTS_MAX_CLIP_S = 6;

/** Confidence thresholds (§8.8). */
export const CONFIDENCE = { execute: 0.8, ask: 0.5, recordingNoConfirm: 0.9 };

/** Wake word (§8.8). */
export const WAKE_WORD_ENABLED = true;
export const WAKE_WORDS = ['bolo', 'बोलो', 'ಬೋಲೋ', 'bollo', 'below', 'polo'];

/** VAD tuning (§8.8). VERIFY: defaults against @ricky0123/vad-web docs in M2. */
export const VAD = {
  positiveSpeechThreshold: 0.5,
  minSpeechFrames: 3,
  noisy: { positiveSpeechThreshold: 0.75, minSpeechFrames: 6 },
};

/** VR (§8.2). */
export const VR = { eyeSeparation: 0.064, maxPixelRatio: 1.5, skyCrossfadeMs: 600 };

/** Recording (§8.7). */
export const REEL = { width: 720, height: 1280, fps: 30, defaultSeconds: 15, minSeconds: 5, maxSeconds: 30 };

/** Upload size limits in bytes (§12). */
export const LIMITS = { image: 5 * 1024 * 1024, audio: 1024 * 1024, reel: 25 * 1024 * 1024 };

export const SKIES = ['palace', 'beach', 'studio', 'market'];
export const LANGUAGES = ['en-IN', 'hi-IN', 'kn-IN'];

/** Brand colours (§16). Only these. */
export const COLORS = { ink: '#05070d', white: '#f2f5fb', cobalt: '#3b74ff', pale: '#8fb6ff' };

/** Keep ON during the hackathon: HUD shows timings and last error. */
export const DEBUG = true;

export const LOG_PREFIX = '[BoloVerse]';
