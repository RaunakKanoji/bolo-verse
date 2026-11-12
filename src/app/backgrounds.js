/**
 * The 8 preloaded backgrounds (public/backgrounds) and keyword matching.
 * They are the fallback when a generated background fails, is unavailable, or takes > 20 s.
 * To use photos instead, drop e.g. beach.jpg next to the SVGs and change `file` below.
 */
import { LOG_PREFIX } from '../shared/config.js';

export const BACKGROUNDS = [
  { id: 'studio', label: 'Studio', file: '/backgrounds/studio.svg', keywords: ['studio', 'plain', 'grey', 'gray', 'white', 'minimal', 'clean', 'seamless', 'neutral', 'simple'] },
  { id: 'marble', label: 'Marble', file: '/backgrounds/marble.svg', keywords: ['marble', 'luxury', 'premium', 'elegant', 'jewellery', 'jewelry', 'cosmetic', 'kitchen', 'counter', 'stone top'] },
  { id: 'beach', label: 'Beach', file: '/backgrounds/beach.svg', keywords: ['beach', 'sea', 'ocean', 'sand', 'coast', 'summer', 'sunset', 'holiday', 'goa', 'samudra'] },
  { id: 'palace', label: 'Palace', file: '/backgrounds/palace.svg', keywords: ['palace', 'royal', 'heritage', 'mahal', 'arch', 'fort', 'traditional', 'wedding', 'mysore', 'rajasthan', 'festive'] },
  { id: 'market', label: 'Market', file: '/backgrounds/market.svg', keywords: ['market', 'bazaar', 'bazar', 'stall', 'shop', 'street', 'evening', 'lights', 'diwali', 'fair', 'mela'] },
  { id: 'wood', label: 'Wood', file: '/backgrounds/wood.svg', keywords: ['wood', 'wooden', 'table', 'rustic', 'home', 'cafe', 'handmade', 'craft', 'artisan', 'warm', 'cozy', 'cosy'] },
  { id: 'garden', label: 'Garden', file: '/backgrounds/garden.svg', keywords: ['garden', 'nature', 'green', 'leaf', 'leaves', 'plant', 'organic', 'outdoor', 'park', 'fresh', 'herbal', 'forest'] },
  { id: 'night', label: 'Night', file: '/backgrounds/night.svg', keywords: ['night', 'city', 'dark', 'neon', 'urban', 'party', 'blue', 'modern', 'tech', 'bokeh'] },
];

export const DEFAULT_BACKGROUND = 'studio';

/**
 * Picks the closest preloaded background for free text (brief.scene / background_prompt).
 * Scores whole-word keyword hits (2) above substring hits (1). Ties keep catalogue order.
 * @param {string} text
 * @returns {string} background id
 */
export function pickBackground(text) {
  const t = ` ${String(text ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ')} `;
  let best = DEFAULT_BACKGROUND;
  let bestScore = 0;
  for (const bg of BACKGROUNDS) {
    let score = t.includes(` ${bg.id} `) ? 3 : 0;
    for (const k of bg.keywords) {
      if (t.includes(` ${k} `)) score += 2;
      else if (t.includes(k)) score += 1;
    }
    if (score > bestScore) {
      best = bg.id;
      bestScore = score;
    }
  }
  return best;
}

const cache = new Map();

/**
 * Loads a background image (cached). Resolves to an HTMLImageElement.
 * @param {string} id
 */
export function loadBackground(id) {
  const bg = BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0];
  if (!cache.has(bg.id)) {
    cache.set(
      bg.id,
      new Promise((resolve, reject) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => resolve(img);
        img.onerror = () => {
          cache.delete(bg.id);
          console.error(LOG_PREFIX, 'background failed to load', bg.file);
          reject(new Error(`could not load ${bg.file}`));
        };
        img.src = bg.file;
      }),
    );
  }
  return cache.get(bg.id);
}

/** Starts loading all 8 so switching is instant. */
export const preloadBackgrounds = () => Promise.allSettled(BACKGROUNDS.map((b) => loadBackground(b.id)));
