import { describe, it, expect } from 'vitest';
import { scales, tones, tunings, KEYS, PHRASE_MODE_GROUPS, ScaleName, Tone, PhraseMode } from '../constants';
import { getScalePitchClasses, keyToOffset } from '../music';
import { buildRelSequence, getPhraseRootAbs, getPlayableOctaves } from '../phrases';
import { getStringBaseNotes, getFretboardRange } from '../theory/positions';

// Plain E-rooted note name, enough to read a sequence back as music
const noteName = (abs: number): Tone => tones[((abs % 12) + 12) % 12];

const buildNoteSequence = (
  scaleName: ScaleName,
  key: Tone,
  mode: PhraseMode,
  options: { octaves: number; descend?: boolean }
): string[] => {
  const scale = scales[scaleName];
  const pcs = getScalePitchClasses(scale);
  const relSequence = buildRelSequence(pcs, mode, options.octaves, options.descend ?? false);
  const keyOffset = keyToOffset(key);
  return relSequence.map((rel) => noteName(keyOffset + rel));
};

describe('music theory integration', () => {
  it('constructs a C major scale across two octaves', () => {
    const names = buildNoteSequence('major', 'c', 'full-scale', { octaves: 2 });

    expect(names).toEqual([
      'c', 'd', 'e', 'f', 'g', 'a', 'b',
      'c', 'd', 'e', 'f', 'g', 'a', 'b',
    ]);
  });

  it('builds an A natural minor run that ascends and descends', () => {
    const names = buildNoteSequence('minor', 'a', 'full-scale', {
      octaves: 1,
      descend: true,
    });

    expect(names).toEqual([
      'a', 'b', 'c', 'd', 'e', 'f', 'g',
      'a',
      'g', 'f', 'e', 'd', 'c', 'b', 'a',
    ]);
  });

  it('focuses on chord tones for sweep arpeggio patterns', () => {
    const names = buildNoteSequence('major', 'c', 'sweep-arp', { octaves: 1 });

    expect(names).toEqual(['c', 'e', 'g', 'b', 'g', 'e', 'c']);
  });
});

// The phrase used to be built from the bare key offset, which pins it to the
// E4 origin: change the start octave or the tuning and the notes it plays no
// longer exist on the fretboard being displayed.
describe('phrases land on the rendered fretboard', () => {
  const ALL_MODES = PHRASE_MODE_GROUPS.flatMap((group) => group.modes.map((m) => m.value));

  const phraseNotes = (opts: {
    tuning: keyof typeof tunings;
    strings: number;
    frets: number;
    startOctave: number;
    key: string;
    scale: ScaleName;
    octaves: number;
    mode?: PhraseMode;
  }) => {
    const mode = opts.mode ?? 'full-scale';
    const baseNotes = getStringBaseNotes(tunings[opts.tuning], opts.strings, opts.startOctave);
    const { lowest, highest } = getFretboardRange(baseNotes, opts.frets);
    const rootAbs = getPhraseRootAbs(keyToOffset(opts.key), lowest);
    const pcs = getScalePitchClasses(scales[opts.scale]);
    const octaves = getPlayableOctaves(pcs, mode, opts.octaves, true, rootAbs, highest);
    return {
      lowest,
      highest,
      octaves,
      notes: buildRelSequence(pcs, mode, octaves, true).map((rel) => rootAbs + rel),
    };
  };

  const CONFIGS = [
    { tuning: 'Standard' as const, strings: 6, frets: 24 },
    { tuning: 'Drop C' as const, strings: 6, frets: 22 },
    { tuning: '8-String' as const, strings: 8, frets: 24 },
    { tuning: 'Bass Standard' as const, strings: 4, frets: 21 },
  ];

  CONFIGS.forEach((config) => {
    it(`stays within reach on ${config.tuning} at every key and start octave`, () => {
      [0, 2, 4, 6, 9].forEach((startOctave) => {
        KEYS.forEach((key) => {
          const { lowest, highest, notes } = phraseNotes({
            ...config,
            startOctave,
            key,
            scale: 'major',
            octaves: 5,
          });
          expect(notes.length).toBeGreaterThan(0);
          notes.forEach((abs) => {
            expect(abs).toBeGreaterThanOrEqual(lowest);
            expect(abs).toBeLessThanOrEqual(highest);
          });
        });
      });
    });
  });

  it('stays within reach for every phrase mode', () => {
    ALL_MODES.forEach((mode) => {
      ['major', 'blues', 'pentatonic'].forEach((scale) => {
        const { lowest, highest, octaves, notes } = phraseNotes({
          tuning: 'Standard', strings: 6, frets: 24, startOctave: 4,
          key: 'c', scale: scale as ScaleName, octaves: 5, mode,
        });
        expect(notes.length).toBeGreaterThan(0);
        notes.forEach((abs) => expect(abs).toBeGreaterThanOrEqual(lowest));
        // A single octave is the floor: it can overhang a neck too short for it
        if (octaves > 1) {
          notes.forEach((abs) => expect(abs).toBeLessThanOrEqual(highest));
        }
      });
    });
  });

  it('transposes with the start octave instead of staying put', () => {
    const args = {
      tuning: 'Standard' as const, strings: 6, frets: 24,
      key: 'a', scale: 'minor' as ScaleName, octaves: 2,
    };
    const low = phraseNotes({ ...args, startOctave: 4 });
    const high = phraseNotes({ ...args, startOctave: 5 });
    expect(low.notes.length).toBe(high.notes.length);
    low.notes.forEach((abs, i) => expect(high.notes[i] - abs).toBe(12));
  });
});
