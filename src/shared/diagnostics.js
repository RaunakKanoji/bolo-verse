/**
 * M0 diagnostics: proves the phone can reach Supabase (auth, DB + RLS, storage,
 * realtime) and every Edge Function skeleton, and reports browser capabilities
 * the studio needs. Rendered on the root page (/).
 */
import { ENV, FUNCTIONS, LOG_PREFIX, TIMEOUTS } from './config.js';
import { callFunction, ensureAnonUser, isConfigured, supabase } from './supabaseClient.js';

/**
 * Renders a check row and returns a function that resolves it.
 * @param {HTMLUListElement} list
 * @param {string} name
 */
function row(list, name) {
  const li = document.createElement('li');
  li.innerHTML = `<span class="mark">…</span><span class="name"></span><span class="ms"></span><span class="detail"></span>`;
  li.querySelector('.name').textContent = name;
  list.append(li);
  return (ok, detail = '', ms) => {
    li.className = ok ? 'ok' : 'fail';
    li.querySelector('.mark').textContent = ok ? '✓' : '✗';
    li.querySelector('.detail').textContent = detail;
    if (ms != null) li.querySelector('.ms').textContent = `${ms} ms`;
  };
}

/** Runs `fn` with timing; any throw becomes a failed row. */
async function check(list, name, fn) {
  const done = row(list, name);
  const t = performance.now();
  try {
    const detail = await fn();
    done(true, detail ?? '', Math.round(performance.now() - t));
    return true;
  } catch (err) {
    console.error(LOG_PREFIX, name, err);
    done(false, String(err?.message ?? err), Math.round(performance.now() - t));
    return false;
  }
}

/** Browser capability checks (no permissions requested). */
export function runDeviceChecks(list) {
  const caps = [
    ['Secure context (HTTPS or localhost)', window.isSecureContext, location.protocol + '//' + location.host],
    ['Microphone API (getUserMedia)', Boolean(navigator.mediaDevices?.getUserMedia), ''],
    ['Motion sensors (DeviceOrientationEvent)', 'DeviceOrientationEvent' in window, ''],
    ['WebGL', (() => { try { return Boolean(document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl')); } catch { return false; } })(), ''],
    ['MediaRecorder', 'MediaRecorder' in window, ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((t) => window.MediaRecorder?.isTypeSupported?.(t)) ?? 'no webm type'],
    ['Wake Lock API', 'wakeLock' in navigator, ''],
    ['Fullscreen API', Boolean(document.documentElement.requestFullscreen), ''],
    ['Orientation lock API', Boolean(screen.orientation?.lock), `${screen.orientation?.type ?? '?'} ${screen.orientation?.angle ?? ''}°`],
  ];
  for (const [name, ok, detail] of caps) row(list, name)(ok, detail);
}

/** Supabase + Edge Function checks. */
export async function runBackendChecks(list) {
  const envOk = await check(list, 'Env vars (VITE_SUPABASE_URL / ANON_KEY)', async () => {
    if (!isConfigured) throw new Error('missing: copy .env.example to .env (or set them in Vercel) and rebuild');
    return ENV.SUPABASE_URL;
  });
  if (!envOk) return;

  let uid = null;
  const authOk = await check(list, 'Anonymous sign-in', async () => {
    const user = await ensureAnonUser();
    uid = user.id;
    return `user ${user.id.slice(0, 8)}… anonymous=${user.is_anonymous}`;
  });
  if (!authOk) return;

  await check(list, 'DB: create + read + delete own session (RLS)', async () => {
    const token = crypto.randomUUID().replaceAll('-', '');
    const { data, error } = await supabase
      .from('sessions').insert({ creator_id: uid, join_token: token }).select('id').single();
    if (error) throw new Error(`${error.code ?? ''} ${error.message} (did you run the migration?)`);
    const { data: read, error: e2 } = await supabase.from('sessions').select('id').eq('id', data.id);
    if (e2 || read.length !== 1) throw new Error(e2?.message ?? 'could not read back own session');
    const { error: e3 } = await supabase.from('sessions').delete().eq('id', data.id);
    if (e3) throw new Error(`delete: ${e3.message}`);
    return `session ${data.id.slice(0, 8)}… ok`;
  });

  await check(list, 'Storage: private buckets exist', async () => {
    for (const bucket of ['products', 'reels']) {
      const { error } = await supabase.storage.from(bucket).list(uid, { limit: 1 });
      if (error) throw new Error(`${bucket}: ${error.message}`);
    }
    return 'products, reels';
  });

  await check(list, 'Realtime: subscribe to products', () =>
    new Promise((resolve, reject) => {
      const channel = supabase.channel(`m0-check-${Date.now()}`);
      const timer = setTimeout(() => { supabase.removeChannel(channel); reject(new Error('no SUBSCRIBED within 5 s')); }, TIMEOUTS.realtimeConnect);
      channel
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' }, () => {})
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') { clearTimeout(timer); supabase.removeChannel(channel); resolve('SUBSCRIBED'); }
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') { clearTimeout(timer); reject(new Error(`${status} ${err?.message ?? ''}`)); }
        });
    }),
  );

  await Promise.all(
    FUNCTIONS.map((name) =>
      check(list, `Edge Function: ${name}`, async () => {
        const r = await callFunction(name, { ping: true });
        if (!r.ok) throw new Error(`${r.status ?? ''} ${r.error ?? 'failed'} (deployed?)`);
        return `${r.data.status} · user ${String(r.data.user).slice(0, 8)}…`;
      }),
    ),
  );
}
