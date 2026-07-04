// Scales are defined as intervals in semitones between consecutive notes
export const scales = {
  // Basic scales
  major: [2, 2, 1, 2, 2, 2, 1],
  minor: [2, 1, 2, 2, 1, 2, 2],

  // Pentatonic scales
  pentatonic: [3, 2, 2, 3, 2], // minor pentatonic
  "pentatonic major": [2, 2, 3, 2, 3],
  blues: [3, 2, 1, 1, 3, 2],

  // Church modes
  dorian: [2, 1, 2, 2, 2, 1, 2],
  phrygian: [1, 2, 2, 2, 1, 2, 2],
  lydian: [2, 2, 2, 1, 2, 2, 1],
  mixolydian: [2, 2, 1, 2, 2, 1, 2],
  locrian: [1, 2, 2, 1, 2, 2, 2],

  // Harmonic scales
  "harmonic minor": [2, 1, 2, 2, 1, 3, 1],
  "harmonic major": [2, 2, 1, 2, 1, 3, 1],

  // Exotic/World scales
  arabian: [2, 2, 1, 1, 2, 2, 2],
  persian: [1, 3, 1, 1, 2, 3, 1],
  "double harmonic": [1, 3, 1, 2, 1, 3, 1], // Byzantine / Gypsy major scale
  hungarian: [2, 1, 3, 1, 1, 3, 1],
  spanish: [1, 3, 1, 2, 1, 2, 2], // Phrygian dominant

  // Japanese scales
  japanese: [1, 4, 2, 1, 4],
  hirajoshi: [2, 1, 4, 1, 4],

  // Modern/Jazz scales
  "whole tone": [2, 2, 2, 2, 2, 2],
  diminished: [1, 2, 1, 2, 1, 2, 1, 2], // Half-whole diminished
  chromatic: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],

  // Symmetrical interval scales
  "minor thirds": [3], // Diminished 7th chord as scale (C-Eb-Gb-A)
  "major thirds": [4], // Augmented triad (C-E-Ab)
} as const;

export type ScaleName = keyof typeof scales;

// Display metadata for the scale picker, grouped by family (same shape as
// PHRASE_MODE_GROUPS). Every scale in the catalog must appear exactly once.
export const SCALE_GROUPS: ReadonlyArray<{
  label: string;
  scales: ReadonlyArray<{ value: ScaleName; label: string }>;
}> = [
  {
    label: "Essential",
    scales: [
      { value: "major", label: "Major" },
      { value: "minor", label: "Minor" },
      { value: "pentatonic", label: "Pentatonic minor" },
      { value: "pentatonic major", label: "Pentatonic major" },
      { value: "blues", label: "Blues" },
    ],
  },
  {
    label: "Modes",
    scales: [
      { value: "dorian", label: "Dorian" },
      { value: "phrygian", label: "Phrygian" },
      { value: "lydian", label: "Lydian" },
      { value: "mixolydian", label: "Mixolydian" },
      { value: "locrian", label: "Locrian" },
    ],
  },
  {
    label: "Harmonic",
    scales: [
      { value: "harmonic minor", label: "Harmonic minor" },
      { value: "harmonic major", label: "Harmonic major" },
    ],
  },
  {
    label: "World",
    scales: [
      { value: "spanish", label: "Spanish (Phrygian dominant)" },
      { value: "double harmonic", label: "Double harmonic" },
      { value: "hungarian", label: "Hungarian minor" },
      { value: "persian", label: "Persian" },
      { value: "arabian", label: "Arabian" },
      { value: "japanese", label: "Japanese (In)" },
      { value: "hirajoshi", label: "Hirajoshi" },
    ],
  },
  {
    label: "Symmetric",
    scales: [
      { value: "whole tone", label: "Whole tone" },
      { value: "diminished", label: "Diminished (half-whole)" },
      { value: "chromatic", label: "Chromatic" },
      { value: "minor thirds", label: "Minor thirds" },
      { value: "major thirds", label: "Major thirds" },
    ],
  },
];

// Display name per scale, derived from the picker groups so both stay in sync
export const SCALE_LABELS = Object.fromEntries(
  SCALE_GROUPS.flatMap((group) => group.scales.map((s) => [s.value, s.label]))
) as Record<ScaleName, string>;
