import { describe, it, expect } from 'vitest';
import { scales, KEYS, PHRASE_MODE_GROUPS } from './constants';
import type { PhraseMode } from './constants';
import { getScalePitchClasses, keyToOffset } from './music';
import { buildRelSequence, getPhraseRootAbs, getPlayableOctaves } from './phrases';

const majorPcs = () => getScalePitchClasses(scales.major);      // 7 notes
const pentaPcs = () => getScalePitchClasses(scales.pentatonic);  // 5 notes
const PHRASE_MODES = PHRASE_MODE_GROUPS.flatMap((g) => g.modes.map((m) => m.value));

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

  it('sixths pairs each degree with the sixth above it, never below', () => {
    const pcs = majorPcs();
    const seq = buildRelSequence(pcs, 'sixths', 1);
    expect(seq.length).toBe(pcs.length * 2);
    for (let i = 0; i < seq.length; i += 2) {
      const interval = (seq[i + 1] as number) - (seq[i] as number);
      // Major scale sixths are 8 or 9 semitones up (minor/major sixth)
      expect(interval).toBeGreaterThanOrEqual(8);
      expect(interval).toBeLessThanOrEqual(9);
    }
    // The wrapped pairs continue into the next octave: last pair is B + G(+12)
    expect(seq[seq.length - 2]).toBe(pcs[6]);
    expect(seq[seq.length - 1]).toBe(pcs[4] + 12);
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

describe('exact phrase sequences', () => {
  it('thirds over one octave of C major', () => {
    // Degree pairs (1,3)(2,4)(3,5)(4,6)(5,7) over [0,2,4,5,7,9,11]
    expect(buildRelSequence(majorPcs(), 'thirds', 1, false)).toEqual([
      0, 4, 2, 5, 4, 7, 5, 9, 7, 11,
    ]);
  });

  it('full-scale ascent over one octave of C major', () => {
    expect(buildRelSequence(majorPcs(), 'full-scale', 1, false)).toEqual([
      0, 2, 4, 5, 7, 9, 11,
    ]);
  });

  it('chord-arp ascends the supplied tones like full-scale', () => {
    const chordPcs = [0, 4, 7] as ReturnType<typeof majorPcs>;
    expect(buildRelSequence(chordPcs, 'chord-arp', 2, false)).toEqual(
      buildRelSequence(chordPcs, 'full-scale', 2, false)
    );
  });

  it('octave expansion lifts each pass by 12 semitones', () => {
    const one = buildRelSequence(majorPcs(), 'full-scale', 1, false);
    const two = buildRelSequence(majorPcs(), 'full-scale', 2, false);
    expect(two.slice(0, one.length)).toEqual(one);
    expect(two.slice(one.length)).toEqual(one.map((v) => v + 12));
  });
});

describe('getPhraseRootAbs', () => {
  // Standard tuning at start octave 4 puts the low E string at abs -24
  const LOW_E = -24;

  it('starts on the lowest string when the key matches it', () => {
    expect(getPhraseRootAbs(keyToOffset('e'), LOW_E)).toBe(-24);
  });

  it('picks the first tonic above the lowest string', () => {
    // A is 5 semitones above E — 5th fret of the low string
    expect(getPhraseRootAbs(keyToOffset('a'), LOW_E)).toBe(-19);
    // C is 8 semitones above E — 8th fret
    expect(getPhraseRootAbs(keyToOffset('c'), LOW_E)).toBe(-16);
  });

  it('never lands below the lowest string, and never a full octave above', () => {
    KEYS.forEach((key) => {
      const root = getPhraseRootAbs(keyToOffset(key), LOW_E);
      expect(root).toBeGreaterThanOrEqual(LOW_E);
      expect(root).toBeLessThan(LOW_E + 12);
    });
  });

  it('follows the fretboard when the start octave changes', () => {
    const low = getPhraseRootAbs(keyToOffset('c'), -24);
    const high = getPhraseRootAbs(keyToOffset('c'), 0); // two octaves up
    expect(high - low).toBe(24);
  });

  it('handles a lowest string below the E4 origin', () => {
    expect(getPhraseRootAbs(keyToOffset('d'), -31)).toBe(-26);
  });
});

describe('getPlayableOctaves', () => {
  const major = () => majorPcs();

  it('keeps the requested span when the neck is long enough', () => {
    // Root on the low string, top fret two octaves up
    expect(getPlayableOctaves(major(), 'full-scale', 2, true, -24, 0)).toBe(2);
  });

  it('clamps to what fits below the top fret', () => {
    expect(getPlayableOctaves(major(), 'full-scale', 5, true, -24, -12)).toBe(1);
    expect(getPlayableOctaves(major(), 'full-scale', 5, true, 0, 30)).toBe(2);
  });

  it('always yields at least one octave', () => {
    expect(getPlayableOctaves(major(), 'full-scale', 3, true, 0, 4)).toBe(1);
  });

  it('accounts for modes that reach above their octave', () => {
    // sixths lifts the wrapped upper note an octave, so its top note sits
    // higher than octaves x 12 — a naive clamp would let it run off the neck
    const pcs = major();
    const room = getPlayableOctaves(pcs, 'sixths', 3, false, 0, 36);
    const top = Math.max(...buildRelSequence(pcs, 'sixths', room, false));
    expect(top).toBeLessThanOrEqual(36);
    expect(getPlayableOctaves(pcs, 'sixths', 3, false, 0, 36))
      .toBeLessThan(getPlayableOctaves(pcs, 'full-scale', 3, false, 0, 36));
  });

  it('never exceeds the neck for any mode', () => {
    const pcs = major();
    PHRASE_MODES.forEach((mode) => {
      const octaves = getPlayableOctaves(pcs, mode, 5, true, 0, 30);
      const sequence = buildRelSequence(pcs, mode, octaves, true);
      if (octaves > 1) expect(Math.max(...sequence)).toBeLessThanOrEqual(30);
    });
  });
});
