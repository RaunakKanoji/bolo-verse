/**
 * Supabase browser client plus a small helper for calling our Edge Functions.
 * Only the public anon key is used here. All provider keys stay server-side.
 */
import { createClient } from '@supabase/supabase-js';
import { ENV, LOG_PREFIX, TIMEOUTS } from './config.js';

/** True when both VITE_ vars are filled in. */
export const isConfigured = Boolean(ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY);

if (!isConfigured) {
  console.warn(LOG_PREFIX, 'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing. Copy .env.example to .env');
}

/** Shared client. The session persists in localStorage, so a reload keeps the same anonymous user. */
export const supabase = isConfigured
  ? createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

/**
 * Returns the current user, signing in anonymously if there is no session yet.
 * Requires "Anonymous Sign-ins" to be enabled in the Supabase dashboard.
 * @returns {Promise<import('@supabase/supabase-js').User>}
 */
export async function ensureAnonUser() {
  if (!supabase) throw new Error('Supabase is not configured');
  const { data: existing } = await supabase.auth.getSession();
  if (existing.session?.user) return existing.session.user;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.user;
}

/**
 * Calls an Edge Function with the user's JWT, a timeout, and our `{ ok, data | error }` envelope.
 * Never throws: failures come back as `{ ok: false, error }` so callers can fall back.
 * @param {string} name  function name, e.g. 'command'
 * @param {object|FormData} body  JSON object, or FormData for audio uploads
 * @param {{ timeoutMs?: number, raw?: boolean }} [opts]  raw=true returns the Response (for audio bytes)
 * @returns {Promise<{ok: boolean, data?: any, error?: string, status?: number, ms: number, response?: Response}>}
 */
export async function callFunction(name, body, opts = {}) {
  const started = performance.now();
  const ms = () => Math.round(performance.now() - started);
  if (!supabase) return { ok: false, error: 'not_configured', ms: 0 };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? TIMEOUTS.default);
  try {
    const { data: s } = await supabase.auth.getSession();
    const headers = {
      apikey: ENV.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${s.session?.access_token ?? ENV.SUPABASE_ANON_KEY}`,
    };
    const isForm = body instanceof FormData;
    if (!isForm) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${ENV.FUNCTIONS_URL}/${name}`, {
      method: 'POST',
      headers,
      body: isForm ? body : JSON.stringify(body ?? {}),
      signal: controller.signal,
    });
    if (opts.raw && res.ok) return { ok: true, response: res, status: res.status, ms: ms() };
    const json = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status} (non-JSON)` }));
    return { ...json, ok: Boolean(json.ok) && res.ok, status: res.status, ms: ms() };
  } catch (err) {
    const error = err?.name === 'AbortError' ? 'timeout' : String(err?.message ?? err);
    console.error(LOG_PREFIX, `function ${name} failed:`, error);
    return { ok: false, error, ms: ms() };
  } finally {
    clearTimeout(timer);
  }
}
