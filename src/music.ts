import { tones, Tone } from "./constants";

const noteKeys = Object.keys(tones);

const noteMap = (tones as readonly string[]).reduce<Record<string, number>>(
  (accumulator, target) => ({
    ...accumulator,
    [target]: Object.keys(accumulator).length,
  }),
  {}
);

const getNote = (offset: number): Tone =>
  tones[((offset % tones.length) + tones.length) % tones.length];

const getKey = (offset: number): string => noteKeys[offset % noteKeys.length];

const keyToOffset = (key: string): number => noteMap[key];

const getTones = (scale: readonly number[], steps: number, key?: string) => {
  let step = 0;
  const ret: number[] = [];

  // TODO: need to take offset into account
  while (step < steps + 9) {
    const rest = scale.map((interval) => {
      // eslint-disable-next-line no-plusplus
      step += interval;
      return step;
    });

    ret.push(...rest);
  }

  return [0, ...ret]; // in order to include base tone...
};

export { getNote, getKey, getTones, keyToOffset };

// New helpers to reason about scale pitch classes and degrees
// Returns cumulative semitone positions within an octave for the given scale
// e.g., [2,2,1,2,2,2,1] -> [0,2,4,5,7,9,11]
export const getScalePitchClasses = (scale: readonly number[]): number[] => {
  // Build cumulative semitone positions within one octave by
  // cycling through the provided intervals until we reach 12.
  // This ensures short definitions like [1] (chromatic) or [3]
  // (diminished thirds) expand to the intended pitch classes.
  const pcs: number[] = [0];
  let acc = 0;
  if (scale.length === 0) return pcs;
  // Safety cap to avoid infinite loops if given pathological data
  const maxSteps = 24; // enough to cover edge cases
  let steps = 0;
  while (acc < 12 && steps < maxSteps) {
    for (const interval of scale) {
      acc += interval;
      if (acc >= 12) break;
      pcs.push(acc % 12);
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
  const idx = pcs.indexOf(pc);
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
