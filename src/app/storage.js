/**
 * Saving videos to Supabase: one session per browser (anonymous user), reels stored in the
 * private `reels` bucket under <session_id>/, and a 24 h signed URL for the player/QR.
 */
import { LIMITS, LOG_PREFIX } from '../shared/config.js';
import { ensureAnonUser, isConfigured, supabase } from '../shared/supabaseClient.js';

const SESSION_KEY = 'boloverse.session_id';
const SIGNED_URL_SECONDS = 24 * 60 * 60;

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

let sessionPromise = null;

/**
 * Returns this browser's session id, creating the anonymous user/session if needed.
 * @returns {Promise<string>}
 */
export function ensureSession() {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      if (!isConfigured) throw new Error('Supabase is not configured');
      const user = await ensureAnonUser();
      let id = null;
      try {
        id = localStorage.getItem(SESSION_KEY);
      } catch {
        /* storage blocked: create a fresh session */
      }
      if (id) {
        const { data } = await supabase.from('sessions').select('id').eq('id', id).maybeSingle();
        if (data) return id;
      }
      const { data, error } = await supabase
        .from('sessions')
        .insert({ creator_id: user.id, join_token: randomToken(), consent_given: true })
        .select('id')
        .single();
      if (error) throw error;
      try {
        localStorage.setItem(SESSION_KEY, data.id);
      } catch {
        /* ignore */
      }
      return data.id;
    })().catch((err) => {
      sessionPromise = null;
      throw err;
    });
  }
  return sessionPromise;
}

/**
 * Uploads a recorded video and returns a signed URL for playback/sharing.
 * @param {Blob} blob
 * @param {{ durationS: number }} meta
 * @returns {Promise<{ reelId: string, path: string, url: string, uploadMs: number }>}
 */
export async function uploadReel(blob, { durationS }) {
  if (blob.size > LIMITS.reel) throw new Error(`video is ${(blob.size / 1e6).toFixed(1)} MB (limit 25 MB)`);
  const t0 = performance.now();
  const sessionId = await ensureSession();
  const path = `${sessionId}/${crypto.randomUUID()}.webm`;

  const { error: upErr } = await supabase.storage
    .from('reels')
    .upload(path, blob, { contentType: 'video/webm', upsert: false });
  if (upErr) throw upErr;

  const { data: row, error: rowErr } = await supabase
    .from('reels')
    .insert({ session_id: sessionId, video_path: path, duration_s: durationS })
    .select('id')
    .single();
  if (rowErr) console.warn(LOG_PREFIX, 'reel row insert failed (video is still saved)', rowErr);

  const { data: signed, error: signErr } = await supabase.storage
    .from('reels')
    .createSignedUrl(path, SIGNED_URL_SECONDS);
  if (signErr) throw signErr;

  return { reelId: row?.id ?? '', path, url: signed.signedUrl, uploadMs: Math.round(performance.now() - t0) };
}
