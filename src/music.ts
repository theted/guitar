import { tones, Tone } from "./constants/tones";
import type { PitchClass, KeyOffset } from "./types/music";

const noteMap = (tones as readonly string[]).reduce<Record<string, number>>(
  (accumulator, target) => ({
    ...accumulator,
    [target]: Object.keys(accumulator).length,
  }),
  {}
);

const getNote = (offset: number): Tone =>
  tones[((offset % tones.length) + tones.length) % tones.length];

const keyToOffset = (key: string): KeyOffset => noteMap[key] as KeyOffset;

export { getNote, keyToOffset };

// Returns cumulative semitone positions within an octave for the given scale
// e.g., [2,2,1,2,2,2,1] -> [0,2,4,5,7,9,11]
export const getScalePitchClasses = (scale: readonly number[]): PitchClass[] => {
  const pcs: PitchClass[] = [0 as PitchClass];
  let acc = 0;
  if (scale.length === 0) return pcs;
  const maxSteps = 24;
  let steps = 0;
  while (acc < 12 && steps < maxSteps) {
    for (const interval of scale) {
      acc += interval;
      if (acc >= 12) break;
      pcs.push((acc % 12) as PitchClass);
    }
    steps += 1;
  }
  return pcs;
};

// Returns 1-based degree index in the scale for a given absolute semitone offset, or null if not in scale
export const getDegreeInScale = (
  noteAbs: number,
  keyOffset: number,
  scale: readonly number[]
): number | null => {
  const pcs = getScalePitchClasses(scale);
  const pc = (((noteAbs - keyOffset) % 12) + 12) % 12;
  const idx = pcs.indexOf(pc as PitchClass);
  return idx >= 0 ? idx + 1 : null;
};

// Octave helpers relative to E4 anchor (abs=0 -> E4)
export const getOctaveIndex = (absFromE4: number): number => {
  // Scientific pitch number base: C5 occurs at abs=8
  return 5 + Math.floor((absFromE4 - 8) / 12);
};

// Display octave offset so UI starts at scientific number (E1 -> 1)
const DISPLAY_OCTAVE_OFFSET = 0;

export const getNoteWithOctave = (absFromE4: number): string => {
  const pc = ((absFromE4 % 12) + 12) % 12;
  const name = (tones[pc] as string).toUpperCase();
  const oct = getOctaveIndex(absFromE4) - DISPLAY_OCTAVE_OFFSET;
  return `${name}${oct}`;
};
