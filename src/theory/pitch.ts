import type { PitchClass } from "@/types/music";

/**
 * Fold any semitone into a pitch class (0–11), negatives included.
 *
 * Notes below the E4 origin are ordinary here — a low B string sits at -29 —
 * so plain `% 12` is never right on its own.
 */
export const mod12 = (semitone: number): PitchClass =>
  ((((semitone % 12) + 12) % 12) as PitchClass);

/** Pitch class of `abs` measured from a key's tonic. */
export const relativeTo = (abs: number, keyOffset: number): PitchClass =>
  mod12(abs - keyOffset);
