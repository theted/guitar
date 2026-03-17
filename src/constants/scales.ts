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
  "double harmonic": [1, 3, 1, 2, 1, 3, 1], // Byzantine scale
  hungarian: [2, 1, 3, 1, 1, 3, 1],
  gypsy: [1, 3, 1, 2, 1, 3, 1], // Same as double harmonic
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
  "whole steps": [2], // Same as whole tone but expressed as repeating interval

  // Test/experimental (kept for compatibility)
  test: [2],
  weird: [4],
} as const;

export type ScaleName = keyof typeof scales;
