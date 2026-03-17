import { describe, it, expect } from 'vitest';
import { scales } from './constants';
import type { PhraseMode } from './constants';
import { getScalePitchClasses } from './music';
import { buildRelSequence } from './phrases';

const majorPcs = () => getScalePitchClasses(scales.major);      // 7 notes
const pentaPcs = () => getScalePitchClasses(scales.pentatonic);  // 5 notes

describe('phrase builder', () => {
  it('full-scale includes all degrees across octaves', () => {
    const pcs = majorPcs();
    const seq = buildRelSequence(pcs, 'full-scale', 2);
    expect(seq.length).toBe(pcs.length * 2);
    expect(seq.slice(0, pcs.length)).toEqual(pcs);
    expect(seq.slice(pcs.length)).toEqual(pcs.map((p) => p + 12));
  });

  it('chromatic full-scale covers 12 tones per octave', () => {
    const pcs = getScalePitchClasses(scales.chromatic);
    expect(pcs.length).toBe(12);
    const seq = buildRelSequence(pcs, 'full-scale', 1);
    expect(new Set(seq.map((v) => v % 12)).size).toBe(12);
  });

  // Every-degree coverage for modes that visit all scale degrees
  const everydegModes: PhraseMode[] = [
    'full-scale', 'snake', 'motif-1232', 'four-note-groups',
    'thirds', 'fourths', 'sixths',
  ];
  everydegModes.forEach((m) => {
    it(`${m} includes every degree for one octave`, () => {
      const pcs = majorPcs();
      const seq = buildRelSequence(pcs, m, 1);
      const covered = new Set(seq.map((v) => ((v % 12) + 12) % 12));
      pcs.forEach((pc) => expect(covered.has(pc)).toBe(true));
    });
  });

  // Smoke tests: all modes produce non-empty output for major and pentatonic
  const allModes: PhraseMode[] = [
    'full-scale', 'snake', 'snake-complex', 'motif-1232', 'four-note-groups',
    'thirds', 'fourths', 'sixths', 'triads', 'sevenths',
    'alternate-picking', 'pedal-tone', 'sequence-asc', 'sequence-desc',
    'skip-pattern', 'sweep-arp', 'neo-classical', 'power-chord',
    'djent-palm', 'polyrhythm', 'breakdown-chug', 'tremolo', 'legato-cascade',
  ];

  allModes.forEach((m) => {
    it(`${m} returns non-empty output for major scale`, () => {
      const seq = buildRelSequence(majorPcs(), m, 1);
      expect(seq.length).toBeGreaterThan(0);
    });

    it(`${m} returns non-empty output for pentatonic (5-note) scale`, () => {
      const seq = buildRelSequence(pentaPcs(), m, 1);
      expect(seq.length).toBeGreaterThan(0);
    });
  });

  // Specific pattern tests
  it('snake starts with 1-2-3-2-3-4-3-4-5 pattern', () => {
    const pcs = majorPcs();
    const seq = buildRelSequence(pcs, 'snake', 1);
    const expected = [1, 2, 3, 2, 3, 4, 3, 4, 5].map((d) => pcs[d - 1]);
    expect(seq.slice(0, expected.length)).toEqual(expected);
  });

  it('snake-complex follows 0-based motif mapping', () => {
    const pcs = majorPcs();
    const seq = buildRelSequence(pcs, 'snake-complex', 1);
    const pattern0 = [0, 3, 2, 1, 2, 3, 2, 1, 4, 3, 2, 3];
    const expected = pattern0.map((z) => pcs[z % pcs.length]);
    expect(seq.slice(0, expected.length)).toEqual(expected);
  });

  it('motif-1232 produces same output as snake', () => {
    const pcs = majorPcs();
    expect(buildRelSequence(pcs, 'motif-1232', 1)).toEqual(buildRelSequence(pcs, 'snake', 1));
  });

  it('alternate-picking ascends then descends', () => {
    const pcs = majorPcs();
    const seq = buildRelSequence(pcs, 'alternate-picking', 1);
    // First half ascending, second half descending
    const half = pcs.length;
    expect(seq.slice(0, half)).toEqual(pcs);
    expect(seq.slice(half)).toEqual([...pcs].reverse());
  });

  it('pedal-tone alternates root with each scale degree', () => {
    const pcs = majorPcs();
    const seq = buildRelSequence(pcs, 'pedal-tone', 1);
    // Should be: root, deg2, root, deg3, root, ...
    expect(seq[0]).toBe(pcs[0]); // root
    expect(seq[1]).toBe(pcs[1]); // 2nd
    expect(seq[2]).toBe(pcs[0]); // root again
    expect(seq[3]).toBe(pcs[2]); // 3rd
  });

  it('tremolo repeats root 8 times per octave', () => {
    const pcs = majorPcs();
    const seq = buildRelSequence(pcs, 'tremolo', 1);
    expect(seq.length).toBe(8);
    expect(seq.every((n) => (n as number) === (pcs[0] as number))).toBe(true);
  });

  it('sweep-arp uses odd degrees ascending then descending', () => {
    const pcs = majorPcs(); // 7 notes → odd degs: 1,3,5,7
    const seq = buildRelSequence(pcs, 'sweep-arp', 1);
    expect(seq).toEqual([pcs[0], pcs[2], pcs[4], pcs[6], pcs[4], pcs[2], pcs[0]]);
  });

  it('withDesc appends apex and reversed sequence', () => {
    const pcs = majorPcs();
    const asc = buildRelSequence(pcs, 'full-scale', 1, false);
    const both = buildRelSequence(pcs, 'full-scale', 1, true);
    // desc = asc + apex + asc.reverse
    expect(both.slice(0, asc.length)).toEqual(asc);
    expect(both[asc.length]).toBe(12 + pcs[0]); // apex = one octave up from root
    expect(both.slice(asc.length + 1)).toEqual([...asc].reverse());
  });

  it('octaves clamps to range 1–5', () => {
    const pcs = majorPcs();
    const seq0 = buildRelSequence(pcs, 'full-scale', 0); // clamps to 1
    const seq6 = buildRelSequence(pcs, 'full-scale', 6); // clamps to 5
    const seq1 = buildRelSequence(pcs, 'full-scale', 1);
    const seq5 = buildRelSequence(pcs, 'full-scale', 5);
    expect(seq0).toEqual(seq1);
    expect(seq6).toEqual(seq5);
  });
});
