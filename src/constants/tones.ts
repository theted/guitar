export const tones = [
  "e",
  "f",
  "f#",
  "g",
  "g#",
  "a",
  "a#",
  "b",
  "c",
  "c#",
  "d",
  "d#",
] as const;

export type Tone = (typeof tones)[number];

// Keys selectable in the UI, using conventional spellings (sharp keys up to
// F#, flat keys named with flats). Order follows the circle of fifths from C.
export const KEYS = [
  "c",
  "g",
  "d",
  "a",
  "e",
  "b",
  "f#",
  "db",
  "ab",
  "eb",
  "bb",
  "f",
] as const;

export type KeyName = (typeof KEYS)[number];
