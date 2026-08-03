import { parseKey } from "./theory/spelling";
import type { PitchClass, KeyOffset } from "./types/music";

// Accepts any letter+accidental name ("bb", "f#", "e"), including the legacy
// sharp-only names that may live in persisted state or tuning definitions.
export const keyToOffset = (key: string): KeyOffset => parseKey(key).pc as number as KeyOffset;

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
