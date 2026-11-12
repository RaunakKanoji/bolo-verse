import { describe, expect, it } from 'vitest';
import { DEFAULT_BRIEF, MOTIONS, mergeBrief, parseBrief } from '../src/shared/briefSchema.js';
import { easeInOutCubic, motionAt, sweepAt } from '../src/app/motion.js';
import { gradeFilter, temperatureTint } from '../src/app/grade.js';
import { BACKGROUNDS, pickBackground } from '../src/app/backgrounds.js';

describe('briefSchema', () => {
  it('accepts the default brief', () => expect(parseBrief(DEFAULT_BRIEF).ok).toBe(true));

  it('rejects out-of-range and unknown fields', () => {
    const bad = (patch) => parseBrief(mergeBrief(DEFAULT_BRIEF, patch)).ok;
    expect(bad({ motion: 'zoom' })).toBe(false);
    expect(bad({ duration_s: 20 })).toBe(false);
    expect(bad({ duration_s: 7.5 })).toBe(false);
    expect(bad({ grade: { temperature: 2 } })).toBe(false);
    expect(bad({ grade: { contrast: 0.5 } })).toBe(false);
    expect(bad({ confidence: -0.1 })).toBe(false);
    expect(parseBrief({ ...DEFAULT_BRIEF, extra: 1 }).ok).toBe(false);
  });

  it('mergeBrief edits one grade field and keeps the rest', () => {
    const b = mergeBrief(DEFAULT_BRIEF, { grade: { temperature: 0.5 }, motion: 'orbit' });
    expect(b.grade).toEqual({ temperature: 0.5, brightness: 1, contrast: 1 });
    expect(b.motion).toBe('orbit');
    expect(DEFAULT_BRIEF.motion).toBe('push_in'); // not mutated
  });
});

describe('motion', () => {
  it('eases from 0 to 1 symmetrically', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5);
  });

  it('background moves at 0.6x the product for every motion', () => {
    for (const motion of MOTIONS) {
      for (const p of [0.1, 0.37, 0.8]) {
        const m = motionAt({ motion, speed: 'medium' }, p);
        expect(m.bg.x).toBeCloseTo(m.product.x * 0.6);
        expect(m.bg.scale - 1).toBeCloseTo((m.product.scale - 1) * 0.6);
      }
    }
  });

  it('push_in zooms in, pull_out zooms out, pans go the named way', () => {
    const at = (motion, p, speed = 'medium') => motionAt({ motion, speed }, p).product;
    expect(at('push_in', 1).scale).toBeGreaterThan(at('push_in', 0).scale);
    expect(at('pull_out', 1).scale).toBeLessThan(at('pull_out', 0).scale);
    expect(at('pan_left', 1).x).toBeLessThan(at('pan_left', 0).x);
    expect(at('pan_right', 1).x).toBeGreaterThan(at('pan_right', 0).x);
    expect(Math.abs(at('pan_left', 1, 'slow').x)).toBeLessThan(Math.abs(at('pan_left', 1).x));
  });

  it('clamps progress and runs the light sweep once mid-clip', () => {
    expect(motionAt({ motion: 'push_in', speed: 'slow' }, 2).product.scale).toBeCloseTo(motionAt({ motion: 'push_in', speed: 'slow' }, 1).product.scale);
    expect(sweepAt(0.1)).toBeNull();
    expect(sweepAt(0.9)).toBeNull();
    expect(sweepAt(0.3)).toBe(0);
    expect(sweepAt(0.65)).toBe(1);
  });
});

describe('grade', () => {
  const g = { temperature: 0.8, brightness: 1.4, contrast: 1.2 };
  it('weaker strength moves toward neutral', () => {
    expect(gradeFilter(g, 1)).toContain('brightness(1.400)');
    expect(gradeFilter(g, 0.5)).toContain('brightness(1.200)');
    expect(gradeFilter(g, 0)).toContain('brightness(1.000) contrast(1.000)');
  });
  it('warm/cool tint, none when neutral', () => {
    expect(temperatureTint({ ...g, temperature: 0 })).toBeNull();
    expect(temperatureTint(g).color).toMatch(/255,146/);
    expect(temperatureTint({ ...g, temperature: -0.8 }).color).toMatch(/60,130,255/);
    expect(temperatureTint(g, 0.6).alpha).toBeLessThan(temperatureTint(g, 1).alpha);
  });
});

describe('pickBackground', () => {
  it('has 8 backgrounds', () => expect(BACKGROUNDS).toHaveLength(8));
  it.each([
    ['beach', 'beach'],
    ['sunset by the sea', 'beach'],
    ['royal heritage palace with arches', 'palace'],
    ['busy evening bazaar with lights', 'market'],
    ['rustic wooden table', 'wood'],
    ['lush green garden', 'garden'],
    ['luxury marble counter', 'marble'],
    ['neon city at night', 'night'],
    ['something unrelated', 'studio'],
    ['', 'studio'],
  ])('%s → %s', (text, id) => expect(pickBackground(text)).toBe(id));
});
