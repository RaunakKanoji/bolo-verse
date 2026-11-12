/**
 * In-browser background removal with @imgly/background-removal (runs on the phone; the
 * photo never leaves the device for this step). The model (~44 MB) is fetched from the
 * IMG.LY CDN on first use, then cached by the browser.
 *
 * Licence note: @imgly/background-removal is AGPL-3.0.
 */
import { preload, removeBackground } from '@imgly/background-removal';
import { CUTOUT, LOG_PREFIX, TIMEOUTS } from '../shared/config.js';

/** WebGPU (fast) when the browser exposes it, else WASM on the CPU. */
let device = typeof navigator !== 'undefined' && 'gpu' in navigator ? 'gpu' : 'cpu';
/** Which device the model ended up on ('gpu' | 'cpu'), for the status pill. */
export const cutoutDevice = () => device;

const config = (onProgress) => ({
  model: CUTOUT.model,
  device, // VERIFY: 'gpu' uses onnxruntime-web WebGPU; falls back to 'cpu' below if it fails.
  output: { format: 'image/png' },
  // VERIFY: progress keys look like "fetch:/models/isnet_quint8" / "compute:inference" in v1.7.
  progress: onProgress ? (key, current, total) => onProgress(key, current, total) : undefined,
});

let modelReady = null;

/**
 * Starts downloading/initialising the model. Safe to call many times.
 * @param {(key:string, current:number, total:number) => void} [onProgress]
 * @returns {Promise<void>}
 */
export function preloadCutoutModel(onProgress) {
  if (!modelReady) {
    modelReady = preload(config(onProgress))
      .catch((err) => {
        if (device !== 'gpu') throw err;
        console.warn(LOG_PREFIX, 'WebGPU background removal unavailable, using CPU', err);
        device = 'cpu';
        return preload(config(onProgress));
      })
      .catch((err) => {
        modelReady = null; // allow a retry
        throw err;
      });
  }
  return modelReady;
}

/** Decodes a File/Blob and downscales it so its longest side ≤ maxPx. Returns a canvas. */
export async function downscale(file, maxPx = CUTOUT.maxInputPx) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const s = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bitmap.width * s);
  c.height = Math.round(bitmap.height * s);
  c.getContext('2d').drawImage(bitmap, 0, 0, c.width, c.height);
  bitmap.close?.();
  return c;
}

const toBlob = (canvas, type = 'image/png', q) => new Promise((r) => canvas.toBlob(r, type, q));

/** Trims fully transparent borders so the product's bottom edge really sits on the floor. */
export function trimTransparent(src) {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(src, 0, 0);
  const { data, width, height } = g.getImageData(0, 0, c.width, c.height);
  let top = height, left = width, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 16) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  if (right < 0) return null; // nothing left: removal found no product
  const out = document.createElement('canvas');
  out.width = right - left + 1;
  out.height = bottom - top + 1;
  out.getContext('2d').drawImage(c, left, top, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

/** Fallback look when removal fails: the photo on a white card. */
function framedPhoto(src) {
  const pad = Math.round(Math.max(src.width, src.height) * 0.03);
  const c = document.createElement('canvas');
  c.width = src.width + pad * 2;
  c.height = src.height + pad * 2;
  const g = c.getContext('2d');
  g.fillStyle = '#f2f5fb';
  g.fillRect(0, 0, c.width, c.height);
  g.drawImage(src, pad, pad);
  return c;
}

/**
 * Removes the background from a photo.
 * Never throws: on failure/timeout returns the framed original with cutoutOk=false.
 * @param {File|Blob} file
 * @param {{ onStatus?: (text:string) => void }} [opts]
 * @returns {Promise<{ image: HTMLCanvasElement, cutoutOk: boolean, ms: number, error?: string }>}
 */
export async function cutOut(file, { onStatus = () => {} } = {}) {
  const small = await downscale(file);
  try {
    onStatus('Loading background-removal model…');
    await preloadCutoutModel();
    const t0 = performance.now();
    const tick = setInterval(() => onStatus(`Removing background… ${Math.round((performance.now() - t0) / 1000)} s`), 1000);
    onStatus('Removing background…');
    const input = await toBlob(small, 'image/png');
    let blob;
    try {
      blob = await Promise.race([
        removeBackground(input, config()).catch((err) => {
          if (device !== 'gpu') throw err;
          console.warn(LOG_PREFIX, 'WebGPU inference failed, retrying on CPU', err);
          device = 'cpu';
          return removeBackground(input, config());
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), TIMEOUTS.cutout)),
      ]);
    } finally {
      clearInterval(tick);
    }
    const bitmap = await createImageBitmap(blob);
    const trimmed = trimTransparent(bitmap);
    bitmap.close?.();
    if (!trimmed) throw new Error('no product found in photo');
    return { image: trimmed, cutoutOk: true, ms: Math.round(performance.now() - t0) };
  } catch (err) {
    console.error(LOG_PREFIX, 'background removal failed, using original photo', err);
    return { image: framedPhoto(small), cutoutOk: false, ms: 0, error: String(err?.message ?? err) };
  }
}
