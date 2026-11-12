/**
 * Pure camera-motion maths. Given the brief and progress p ∈ [0,1], returns how the
 * product and background layers are offset/scaled. The background always moves at
 * LAYOUT.parallax (0.6×) of the product's rate.
 */
import { LAYOUT } from '../shared/config.js';

/** Smooth start and end. */
export const easeInOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);

const clamp01 = (p) => Math.min(1, Math.max(0, p));

/** Motion amounts at `medium` speed; `slow` uses 60% of these. */
const AMOUNT = { zoom: 0.14, pan: 90, orbit: 70, orbitSquash: 0.07 };
const speedFactor = (speed) => (speed === 'slow' ? 0.6 : 1);

/**
 * @param {{motion: string, speed: string}} brief
 * @param {number} p  linear progress 0..1 through the clip
 * @returns {{ product: {x:number, y:number, scale:number, squash:number}, bg: {x:number, y:number, scale:number} }}
 *   x/y in output pixels; scale is a multiplier around the layer's anchor; squash multiplies width only.
 */
export function motionAt(brief, p) {
  const e = easeInOutCubic(clamp01(p));
  const k = speedFactor(brief.speed);
  let x = 0;
  let scale = 1;
  let squash = 1;

  switch (brief.motion) {
    case 'push_in':
      scale = 1 + AMOUNT.zoom * k * e;
      break;
    case 'pull_out':
      scale = 1 + AMOUNT.zoom * k * (1 - e);
      break;
    case 'pan_left': // the scene drifts left across the frame
      x = AMOUNT.pan * k * (0.5 - e);
      break;
    case 'pan_right':
      x = AMOUNT.pan * k * (e - 0.5);
      break;
    case 'orbit': {
      // Fake turntable: sway side to side with a slight width squash at the extremes.
      const a = e * Math.PI * 2;
      x = Math.sin(a) * AMOUNT.orbit * k;
      squash = 1 - AMOUNT.orbitSquash * k * Math.abs(Math.sin(a));
      scale = 1 + 0.03 * k * (1 - Math.cos(a)) * 0.5;
      break;
    }
    default:
      break;
  }

  const f = LAYOUT.parallax;
  return {
    product: { x, y: 0, scale, squash },
    bg: { x: x * f, y: 0, scale: 1 + (scale - 1) * f },
  };
}

/**
 * Position of the one-off diagonal light sweep across the product.
 * Returns null outside the sweep window, else 0..1 across the product.
 * @param {number} p  linear progress 0..1
 */
export function sweepAt(p, start = 0.3, end = 0.65) {
  if (p < start || p > end) return null;
  return easeInOutCubic((p - start) / (end - start));
}
