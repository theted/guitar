import { describe, it, expect } from 'vitest';
import { scales, ScaleName, Tone, PhraseMode } from '../constants';
import { getNote, getScalePitchClasses, keyToOffset } from '../music';
import { buildRelSequence } from '../phrases';

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
  return relSequence.map((rel) => getNote(keyOffset + rel));
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
