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
    // Degree pairs (1,3)(2,4)(3,5)(4,6)(5,7)(6,8): the last pair reaches the
    // top tonic. (It used to stop at (5,7), so two octaves skipped 6–8 and
    // 7–9 at the seam.)
    expect(buildRelSequence(majorPcs(), 'thirds', 1, false)).toEqual([
      0, 4, 2, 5, 4, 7, 5, 9, 7, 11, 9, 12,
    ]);
  });

  it('thirds over two octaves continue across the seam: 6–8, 7–9, then 1–3 up', () => {
    expect(buildRelSequence(majorPcs(), 'thirds', 2, false)).toEqual([
      0, 4, 2, 5, 4, 7, 5, 9, 7, 11,
      9, 12, 11, 14, // 6–8, 7–9: the pairs the octave seam used to skip
      12, 16, 14, 17, 16, 19, 17, 21, 19, 23, 21, 24,
    ]);
  });

  it('thirds come back down as thirds, turning on the top tonic', () => {
    expect(buildRelSequence(majorPcs(), 'thirds', 1, true)).toEqual([
      0, 4, 2, 5, 4, 7, 5, 9, 7, 11, 9, 12,
      9, 11, 7, 9, 5, 7, 4, 5, 2, 4, 0,
    ]);
  });

  it('triads over two octaves keep stacking through the seam', () => {
    const seq = buildRelSequence(majorPcs(), 'triads', 2, false);
    // C E G, D F A, E G B, F A C, G B D, A C E, B D F, C E G … B D F, C E G
    expect(seq.slice(0, 21)).toEqual([
      0, 4, 7, 2, 5, 9, 4, 7, 11, 5, 9, 12, 7, 11, 14, 9, 12, 16, 11, 14, 17,
    ]);
    expect(seq.slice(-3)).toEqual([17, 21, 24]);
  });

  it('fourths, four-note groups and sixths continue across the seam', () => {
    expect(buildRelSequence(majorPcs(), 'fourths', 2, false).slice(8, 14)).toEqual([
      7, 12, 9, 14, 11, 16, // 5–8, 6–9, 7–10
    ]);
    expect(buildRelSequence(majorPcs(), 'four-note-groups', 2, false).slice(16, 28)).toEqual([
      7, 9, 11, 12, 9, 11, 12, 14, 11, 12, 14, 16, // 5–8, 6–9, 7–10
    ]);
    expect(buildRelSequence(majorPcs(), 'sixths', 2, false).slice(12, 16)).toEqual([
      11, 19, 12, 21, // 7 with its sixth, then 8 with its sixth
    ]);
  });

  it('interval patterns end on the top tonic', () => {
    const modes: PhraseMode[] = [
      'thirds', 'fourths', 'triads', 'sevenths', 'four-note-groups',
      'snake', 'motif-1232', 'sequence-asc', 'skip-pattern',
    ];
    for (const mode of modes) {
      for (const octaves of [1, 2, 3]) {
        const seq = buildRelSequence(majorPcs(), mode, octaves, false);
        expect(seq[seq.length - 1]).toBe(12 * octaves);
      }
    }
  });

  it('sequence down starts on the top tonic and walks down in threes', () => {
    expect(buildRelSequence(majorPcs(), 'sequence-desc', 1, false)).toEqual([
      12, 11, 9, 11, 9, 7, 9, 7, 5, 7, 5, 4, 5, 4, 2, 4, 2, 0,
    ]);
    // Two octaves used to stack the descending octave upwards: …2,0,23,21…
    const two = buildRelSequence(majorPcs(), 'sequence-desc', 2, false);
    expect(two.slice(0, 3)).toEqual([24, 23, 21]);
    expect(two.slice(15, 24)).toEqual([16, 14, 12, 14, 12, 11, 12, 11, 9]);
    expect(two[two.length - 1]).toBe(0);
  });

  it('sequence down with descend on comes back up the same way', () => {
    const down = buildRelSequence(majorPcs(), 'sequence-desc', 2, false);
    const both = buildRelSequence(majorPcs(), 'sequence-desc', 2, true);
    expect(both).toEqual([...down, ...down.slice(0, -1).reverse()]);
  });

  it('riffs come back without a stray octave peak', () => {
    // Descending used to add the octave in the middle: …0,0,12,0,0…
    expect(buildRelSequence(majorPcs(), 'power-chord', 1, true)).toEqual([
      0, 0, 7, 7, 0, 0, 7, 7, 5, 5, 0, 0,
      0, 5, 5, 7, 7, 0, 0, 7, 7, 0, 0,
    ]);
    expect(buildRelSequence(majorPcs(), 'tremolo', 1, true)).toEqual(Array(15).fill(0));
  });

  it('riffs move up an octave at a time', () => {
    expect(buildRelSequence(majorPcs(), 'tremolo', 2, false)).toEqual([
      ...Array(8).fill(0), ...Array(8).fill(12),
    ]);
  });

  it('there-and-back figures span every octave once, whatever descend says', () => {
    expect(buildRelSequence(majorPcs(), 'sweep-arp', 2, false)).toEqual([
      0, 4, 7, 11, 12, 16, 19, 23, 19, 16, 12, 11, 7, 4, 0,
    ]);
    expect(buildRelSequence(majorPcs(), 'alternate-picking', 2, false)).toEqual([
      0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23,
      23, 21, 19, 17, 16, 14, 12, 11, 9, 7, 5, 4, 2, 0,
    ]);
    (['sweep-arp', 'alternate-picking', 'neo-classical'] as PhraseMode[]).forEach((mode) => {
      [1, 2, 3].forEach((octaves) => {
        expect(buildRelSequence(majorPcs(), mode, octaves, true))
          .toEqual(buildRelSequence(majorPcs(), mode, octaves, false));
      });
    });
  });

  it('the pedal moves up with each octave and the phrase ends on it', () => {
    expect(buildRelSequence(majorPcs(), 'pedal-tone', 2, false)).toEqual([
      0, 2, 0, 4, 0, 5, 0, 7, 0, 9, 0, 11,
      12, 14, 12, 16, 12, 17, 12, 19, 12, 21, 12, 23, 12,
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

// The largest jump between consecutive notes, per mode: [one octave, two or
// three octaves], ascending only and with descend on. Expanding to more
// octaves must not add a leap the mode doesn't already have. The exceptions
// are deliberate and listed: a riff that restarts an octave up (power chord,
// breakdown and tremolo go tonic → tonic an octave up; snake-complex's motif
// ends on the 4th and restarts on the octave), and in the pentatonic, fourths
// and triads meeting their own wider shape (5th → ♭3 an octave up), which a
// single octave stops before reaching. Before the fix sequence-desc leapt 23
// semitones at the seam, and every riff jumped to a lone octave peak on the
// way down.
const maxLeap = (seq: readonly number[]) =>
  seq.slice(1).reduce((max, value, i) => Math.max(max, Math.abs(value - seq[i])), 0);

describe('octave expansion never jumps', () => {
  const MAJOR: Record<PhraseMode, [number, number]> = {
    'full-scale': [2, 2],
    'chord-arp': [2, 2], // fed the whole scale here; see the triad case below
    'snake': [2, 2],
    'snake-complex': [5, 7],
    'motif-1232': [2, 2],
    'four-note-groups': [4, 4],
    'thirds': [4, 4],
    'fourths': [6, 6], // F–B
    'sixths': [9, 9],
    'triads': [6, 6], // from B down to F between triads
    'sevenths': [9, 9],
    'alternate-picking': [2, 2],
    'pedal-tone': [11, 11],
    'sequence-asc': [2, 2],
    'sequence-desc': [2, 2],
    'skip-pattern': [4, 4],
    'sweep-arp': [4, 4],
    'neo-classical': [4, 4],
    'power-chord': [7, 12],
    'djent-palm': [9, 9],
    'polyrhythm': [11, 11],
    'breakdown-chug': [9, 12],
    'tremolo': [0, 12],
    'legato-cascade': [7, 7],
  };

  const PENTATONIC: Record<PhraseMode, [number, number]> = {
    'full-scale': [3, 3],
    'chord-arp': [3, 3],
    'snake': [3, 3],
    'snake-complex': [7, 7],
    'motif-1232': [3, 3],
    'four-note-groups': [5, 5],
    'thirds': [5, 5],
    'fourths': [7, 8],
    'sixths': [5, 5], // fewer than six notes: played as thirds
    'triads': [7, 8],
    'sevenths': [7, 8], // played as triads
    'alternate-picking': [3, 3],
    'pedal-tone': [10, 10],
    'sequence-asc': [3, 3],
    'sequence-desc': [3, 3],
    'skip-pattern': [5, 5],
    'sweep-arp': [5, 5],
    'neo-classical': [4, 4],
    'power-chord': [10, 12],
    'djent-palm': [10, 10],
    'polyrhythm': [10, 10],
    'breakdown-chug': [7, 12],
    'tremolo': [0, 12],
    'legato-cascade': [10, 10],
  };

  it('covers every phrase mode', () => {
    expect(Object.keys(MAJOR).sort()).toEqual([...PHRASE_MODES].sort());
    expect(Object.keys(PENTATONIC).sort()).toEqual([...PHRASE_MODES].sort());
  });

  ([['major', majorPcs, MAJOR], ['pentatonic', pentaPcs, PENTATONIC]] as const).forEach(
    ([name, pcsFor, table]) => {
      PHRASE_MODES.forEach((mode) => {
        it(`${mode} in ${name}: leaps at most ${table[mode].join(' / ')}`, () => {
          const [one, more] = table[mode];
          [false, true].forEach((descend) => {
            expect(maxLeap(buildRelSequence(pcsFor(), mode, 1, descend))).toBe(one);
            expect(maxLeap(buildRelSequence(pcsFor(), mode, 2, descend))).toBe(more);
            expect(maxLeap(buildRelSequence(pcsFor(), mode, 3, descend))).toBe(more);
          });
        });
      });
    }
  );

  it('a chord arpeggio climbs from the fifth to the next root, never further', () => {
    const triad = [0, 4, 7] as ReturnType<typeof majorPcs>;
    [1, 2, 3].forEach((octaves) => {
      expect(maxLeap(buildRelSequence(triad, 'chord-arp', octaves, true))).toBe(5);
    });
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

  it('measures where each mode stops: below, on or past the top tonic', () => {
    const pcs = major();
    // A plain ascent stops a step below the top tonic, thirds end on it
    expect(getPlayableOctaves(pcs, 'full-scale', 2, false, 0, 23)).toBe(2);
    expect(getPlayableOctaves(pcs, 'thirds', 2, false, 0, 23)).toBe(1);
    expect(getPlayableOctaves(pcs, 'thirds', 2, false, 0, 24)).toBe(2);
    // Sequence down starts on it
    expect(getPlayableOctaves(pcs, 'sequence-desc', 2, false, 0, 23)).toBe(1);
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
