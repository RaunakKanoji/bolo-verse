/**
 * Pure colour-grade helpers. A grade is { temperature -1..1, brightness 0.5..1.5, contrast 0.8..1.3 }.
 * `strength` scales the grade toward neutral, so the background can be graded more
 * strongly than the product.
 */

const lerp = (a, b, t) => a + (b - a) * t;

/**
 * CSS/canvas filter string for brightness + contrast (+ a little saturation for warm looks).
 * @param {{temperature:number, brightness:number, contrast:number}} grade
 * @param {number} strength 0..1
 */
export function gradeFilter(grade, strength = 1) {
  const b = lerp(1, grade.brightness, strength);
  const c = lerp(1, grade.contrast, strength);
  const s = 1 + Math.abs(grade.temperature) * 0.12 * strength;
  return `brightness(${b.toFixed(3)}) contrast(${c.toFixed(3)}) saturate(${s.toFixed(3)})`;
}

/**
 * Colour wash for temperature, drawn with 'soft-light' blending.
 * Returns null when the grade is neutral.
 * @returns {{ color: string, alpha: number } | null}
 */
export function temperatureTint(grade, strength = 1) {
  const t = grade.temperature * strength;
  if (Math.abs(t) < 0.01) return null;
  return t > 0
    ? { color: 'rgb(255,146,52)', alpha: Math.min(0.5, t * 0.45) }
    : { color: 'rgb(60,130,255)', alpha: Math.min(0.5, -t * 0.45) };
}

/** Stable key so graded layers are only re-rendered when the grade actually changes. */
export const gradeKey = (grade, strength) =>
  `${grade.temperature.toFixed(2)}|${grade.brightness.toFixed(2)}|${grade.contrast.toFixed(2)}|${strength}`;
