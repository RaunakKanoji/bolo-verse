/**
 * BoloVerse app page (milestone A): photo → cut-out → preloaded background → animated,
 * graded preview → recorded webm → Supabase storage → player, download and QR.
 * The brief object is the single source of truth for the scene; voice (B) will edit it too.
 */
import QRCode from 'qrcode';
import { DEFAULT_BRIEF, MOTIONS, SPEEDS, mergeBrief } from '../shared/briefSchema.js';
import { LIMITS, LOG_PREFIX } from '../shared/config.js';
import { isConfigured } from '../shared/supabaseClient.js';
import { AudioMixer } from './audioMixer.js';
import { BACKGROUNDS, loadBackground, pickBackground, preloadBackgrounds } from './backgrounds.js';
import { Compositor } from './compositor.js';
import { cutOut, cutoutDevice, preloadCutoutModel } from './cutout.js';
import { Player, pickMimeType } from './player.js';
import { ensureSession, uploadReel } from './storage.js';

const $ = (id) => document.getElementById(id);

const compositor = new Compositor($('preview'));
const player = new Player(compositor);
const mixer = new AudioMixer();

let brief = structuredClone(DEFAULT_BRIEF);
let hasProduct = false;
let busy = false;
let lastVideoUrl = null;

// ───────────── Brief → scene ─────────────

/** Applies a (partial) brief change: updates the compositor, background and controls. */
async function applyBrief(patch) {
  const prevScene = brief.scene;
  const prevDuration = brief.duration_s;
  brief = mergeBrief(brief, patch);
  compositor.setBrief(brief);
  if (brief.scene !== prevScene || !compositor.background) {
    const id = pickBackground(brief.scene);
    try {
      compositor.setBackground(await loadBackground(id));
    } catch (err) {
      console.error(LOG_PREFIX, err);
    }
  }
  if (brief.duration_s !== prevDuration) player.play(); // restart loop at the new length
  syncControls();
}

// ───────────── Controls ─────────────

function radio(container, items, current, onPick, render) {
  container.replaceChildren(
    ...items.map((item) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.dataset.value = item.id ?? item;
      b.setAttribute('aria-checked', String((item.id ?? item) === current));
      render(b, item);
      b.addEventListener('click', () => onPick(item.id ?? item));
      return b;
    }),
  );
}

function buildControls() {
  radio($('bgs'), BACKGROUNDS, pickBackground(brief.scene), (id) => applyBrief({ scene: id }), (b, bg) => {
    const img = document.createElement('img');
    img.src = bg.file;
    img.alt = '';
    const span = document.createElement('span');
    span.textContent = bg.label;
    b.append(img, span);
  });
  radio($('motions'), MOTIONS, brief.motion, (m) => { applyBrief({ motion: m }); player.play(); }, (b, m) => (b.textContent = m.replace('_', ' ')));
  radio($('speeds'), SPEEDS, brief.speed, (s) => applyBrief({ speed: s }), (b, s) => (b.textContent = s));

  $('duration').addEventListener('input', (e) => applyBrief({ duration_s: Number(e.target.value) }));
  for (const key of ['temperature', 'brightness', 'contrast']) {
    $(key).addEventListener('input', (e) => applyBrief({ grade: { [key]: Number(e.target.value) } }));
  }
}

/** Reflects the brief in every control (also called after voice edits later). */
function syncControls() {
  const bgId = pickBackground(brief.scene);
  for (const [box, value] of [[$('bgs'), bgId], [$('motions'), brief.motion], [$('speeds'), brief.speed]]) {
    for (const b of box.children) b.setAttribute('aria-checked', String(b.dataset.value === value));
  }
  $('duration').value = brief.duration_s;
  $('durationOut').textContent = `${brief.duration_s} s`;
  for (const key of ['temperature', 'brightness', 'contrast']) {
    $(key).value = brief.grade[key];
    $(`${key}Out`).textContent = brief.grade[key].toFixed(2);
  }
  updateRecordButton();
}

function updateRecordButton() {
  $('record').disabled = busy || !hasProduct;
}

// ───────────── 1. Product photo → cut-out ─────────────

function setModelStatus(text, ready = false) {
  $('modelStatus').textContent = text;
  $('modelStatus').classList.toggle('ready', ready);
}

function startModelPreload() {
  const seen = new Map();
  setModelStatus('Model: downloading…');
  preloadCutoutModel((key, current, total) => {
    if (!key.startsWith('fetch') || !total) return;
    seen.set(key, [current, total]);
    let c = 0, t = 0;
    for (const [a, b] of seen.values()) { c += a; t += b; }
    setModelStatus(`Model: ${Math.round((100 * c) / t)}%`);
  })
    .then(() => setModelStatus(`Model ready ✓ ${cutoutDevice().toUpperCase()}`, true))
    .catch((err) => {
      console.error(LOG_PREFIX, 'model preload failed', err);
      setModelStatus('Model failed: will use photo as-is');
    });
}

$('photo').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  e.target.value = ''; // allow picking the same file again
  if (!file) return;
  if (file.size > LIMITS.image) {
    $('cutoutStatus').textContent = `That photo is ${(file.size / 1e6).toFixed(1)} MB; please use one under 15 MB.`;
    return;
  }
  busy = true;
  updateRecordButton();
  const status = (t) => ($('cutoutStatus').textContent = t);
  status('Preparing photo…');
  const result = await cutOut(file, { onStatus: status });
  compositor.setProduct(result.image);
  hasProduct = true;
  busy = false;
  $('cutoutImg').src = result.image.toDataURL('image/png');
  $('cutoutBox').hidden = false;
  status(
    result.cutoutOk
      ? `Background removed ✓ (${(result.ms / 1000).toFixed(1)} s)`
      : `Couldn't remove the background (${result.error}). Using the photo on a card instead.`,
  );
  $('recordStatus').textContent = 'Ready to record.';
  updateRecordButton();
});

// ───────────── 3. Record → upload → share ─────────────

$('record').addEventListener('click', async () => {
  if (busy || !hasProduct) return;
  busy = true;
  updateRecordButton();
  const status = (t) => ($('recordStatus').textContent = t);
  $('result').hidden = true;

  try {
    await mixer.init(); // must happen inside the tap
    if ($('narrate').checked) {
      try {
        await mixer.connectMic();
      } catch (err) {
        console.warn(LOG_PREFIX, 'mic unavailable', err);
        status('Microphone blocked. Recording without narration.');
      }
    }

    const total = brief.duration_s * 1000;
    $('progress').hidden = false;
    status(`Recording… ${brief.duration_s} s`);
    const { blob, ms } = await player.record({
      audioTrack: mixer.track,
      onTick: (elapsed) => {
        $('progressBar').style.width = `${Math.min(100, (100 * elapsed) / total)}%`;
        status(`Recording… ${Math.max(0, Math.ceil((total - elapsed) / 1000))} s`);
      },
    });
    mixer.disconnectMic();
    $('progress').hidden = true;
    if (blob.size < 20_000) throw new Error('the recording came out empty. Please try again');

    // Local playback + download work even if the upload fails.
    if (lastVideoUrl) URL.revokeObjectURL(lastVideoUrl);
    lastVideoUrl = URL.createObjectURL(blob);
    $('video').src = lastVideoUrl;
    $('download').href = lastVideoUrl;
    $('result').hidden = false;
    $('share').hidden = true;
    console.info(LOG_PREFIX, 'render_ms', ms, 'size', blob.size);

    if (!isConfigured) {
      status(`Recorded ✓ (${(blob.size / 1e6).toFixed(1)} MB). Supabase not configured, so the video is not uploaded.`);
      return;
    }
    status(`Recorded ✓ (${(blob.size / 1e6).toFixed(1)} MB). Uploading…`);
    try {
      const { url, uploadMs } = await uploadReel(blob, { durationS: brief.duration_s });
      await QRCode.toCanvas($('qr'), url, { width: 220, margin: 1, color: { dark: '#05070d', light: '#f2f5fb' } });
      $('shareLink').href = url;
      $('share').hidden = false;
      status(`Saved ✓ (upload ${(uploadMs / 1000).toFixed(1)} s)`);
    } catch (err) {
      console.error(LOG_PREFIX, 'upload failed', err);
      status(`Upload failed (${err.message ?? err}). You can still download the video.`);
    }
  } catch (err) {
    console.error(LOG_PREFIX, 'recording failed', err);
    mixer.disconnectMic();
    $('progress').hidden = true;
    status(`Recording failed: ${err.message ?? err}`);
  } finally {
    busy = false;
    updateRecordButton();
  }
});

// ───────────── Boot ─────────────

buildControls();
await applyBrief({});
player.play();
preloadBackgrounds();
startModelPreload();
if (!pickMimeType()) $('recordStatus').textContent = 'This browser cannot record webm video. Use Chrome on Android.';
if (isConfigured) ensureSession().catch((err) => console.warn(LOG_PREFIX, 'session not ready yet', err));
