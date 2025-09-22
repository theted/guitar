import { describe, it, expect } from 'vitest';
import { scales } from './constants';
import { getScalePitchClasses } from './music';
import { buildRelSequence } from './phrases';

describe('phrase builder', () => {
  it('full-scale includes all degrees across octaves', () => {
    const pcs = getScalePitchClasses(scales.major);
    const seq = buildRelSequence(pcs, 'full-scale', 2);
    // Expect 7 notes per octave for 2 octaves
    expect(seq.length).toBe(pcs.length * 2);
    // First octave is exactly pcs
    expect(seq.slice(0, pcs.length)).toEqual(pcs);
    // Second octave is pcs + 12
    expect(seq.slice(pcs.length)).toEqual(pcs.map((p) => p + 12));
  });

  it('chromatic full-scale covers 12 tones per octave', () => {
    const pcs = getScalePitchClasses(scales.chromatic);
    expect(pcs.length).toBe(12);
    const seq = buildRelSequence(pcs, 'full-scale', 1);
    expect(new Set(seq.map((v) => v % 12)).size).toBe(12);
  });

  const modes = [
    'full-scale',
    'snake',
    'motif-1232',
    'four-note-groups',
    'thirds',
    'fourths',
    'sixths',
    // Triads and sevenths emphasize subsets; exclude from full-degree coverage test
  ] as const;

  modes.forEach((m) => {
    it(`${m} includes every degree for one octave scales`, () => {
      const pcs = getScalePitchClasses(scales.major);
      const seq = buildRelSequence(pcs, m, 1);
      const covered = new Set(seq.map((v) => ((v % 12) + 12) % 12));
      pcs.forEach((pc) => expect(covered.has(pc)).toBe(true));
    });
  });

  it('snake starts with 1-2-3-2-3-4-3-4-5 pattern (mapped to pcs)', () => {
    const pcs = getScalePitchClasses(scales.major);
    const seq = buildRelSequence(pcs, 'snake', 1);
    const expectedDegs = [1,2,3,2,3,4,3,4,5];
    const expected = expectedDegs.map((d) => pcs[d - 1]);
    expect(seq.slice(0, expected.length)).toEqual(expected);
  });

  it('snake-complex follows 0-based motif mapping', () => {
    const pcs = getScalePitchClasses(scales.major);
    const seq = buildRelSequence(pcs, 'snake-complex', 1);
    const pattern0 = [0,3,2,1,2,3,2,1,4,3,2,3];
    const expected = pattern0.map((z) => pcs[z % pcs.length]);
    expect(seq.slice(0, expected.length)).toEqual(expected);
  });
});
