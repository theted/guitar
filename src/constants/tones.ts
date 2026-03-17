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
