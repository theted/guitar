// Interval names by pitch-class distance from the root.
import { mod12 } from "./pitch";

export const INTERVAL_NAMES = [
  "P1", "m2", "M2", "m3", "M3", "P4", "TT", "P5", "m6", "M6", "m7", "M7",
] as const;

export const intervalName = (relativePc: number): string =>
  INTERVAL_NAMES[mod12(relativePc)];

// Semitones of each degree of the major scale: the reference that degree
// names (♭3, ♯4 …) are measured against
const MAJOR_DEGREE_PCS = [0, 2, 4, 5, 7, 9, 11];

/**
 * Which scale degree (letter step from the tonic, 0–6) each note of a scale
 * is read as. Seven-note scales take one letter per note. Others follow
 * guitar convention: the tritone is ♭5 (blues, locrian-like) unless the scale
 * has no 4th and reads major-ish (lydian, whole tone: ♯4); the minor sixth is
 * ♭6 unless there is no 5th to flatten against (whole tone, augmented: ♯5).
 */
export const degreeSteps = (relativePcs: readonly number[]): number[] => {
  if (relativePcs.length === 7) return relativePcs.map((_, index) => index);
  const has = (pc: number) => relativePcs.includes(pc);
  const sharpFour = !has(5) && (has(7) || has(4));
  const sharpFive = !has(7) && (!has(6) || sharpFour);
  const STEP_FOR_PC = [0, 1, 1, 2, 2, 3, sharpFour ? 3 : 4, 4, sharpFive ? 4 : 5, 5, 6, 6];
  return relativePcs.map((pc) => STEP_FOR_PC[mod12(pc)]);
};

/** Degree names for a scale's notes, e.g. blues → 1 ♭3 4 ♭5 5 ♭7 */
export const degreeNames = (relativePcs: readonly number[]): string[] => {
  const steps = degreeSteps(relativePcs);
  return relativePcs.map((pc, index) => {
    let accidental = mod12(pc) - MAJOR_DEGREE_PCS[steps[index]];
    if (accidental > 6) accidental -= 12;
    if (accidental < -6) accidental += 12;
    const sign = accidental < 0 ? "♭".repeat(-accidental) : "♯".repeat(accidental);
    return `${sign}${steps[index] + 1}`;
  });
};
