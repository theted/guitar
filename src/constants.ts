// scales are defined in half-tones from the previous tone in the scale
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
  phrygian: [1, 2, 2, 2, 1, 2, 2], // CORRECTED
  lydian: [2, 2, 2, 1, 2, 2, 1], // CORRECTED  
  mixolydian: [2, 2, 1, 2, 2, 1, 2],
  locrian: [1, 2, 2, 1, 2, 2, 2], // This was correct
  
  // Harmonic scales
  "harmonic minor": [2, 1, 2, 2, 1, 3, 1],
  "harmonic major": [2, 2, 1, 2, 1, 3, 1],
  
  // Exotic/World scales
  arabian: [2, 2, 1, 1, 2, 2, 2], // CORRECTED: Maqam Hijaz variant
  persian: [1, 3, 1, 1, 2, 3, 1], // CORRECTED
  "double harmonic": [1, 3, 1, 2, 1, 3, 1], // Byzantine scale
  hungarian: [2, 1, 3, 1, 1, 3, 1],
  gypsy: [1, 3, 1, 2, 1, 3, 1], // Same as double harmonic
  spanish: [1, 3, 1, 2, 1, 2, 2], // Phrygian dominant
  
  // Japanese scales  
  japanese: [1, 4, 2, 1, 4], // In scale
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
export type ScaleName = keyof typeof scales;

export const tunings = {
  Standard: ["e", "a", "d", "g", "b", "e"],
  "Drop D": ["d", "a", "d", "g", "b", "e"],
  "Open A": ["e", "a", "c#", "e", "a", "e"],
  DADGAD: ["d", "a", "d", "g", "a", "d"],
  DEAD: ["d", "e", "a"],
} as const;

export type TuningName = keyof typeof tunings;
export type Tuning = readonly Tone[];

export const DEFAULTS = {
  STRINGS: 6,
  FRETS: 24,
  TUNING: "Standard" as TuningName,
  SCALE: "blues" as ScaleName,
  KEY: "e" as Tone,
};

export type PhraseMode =
  | "full-scale"
  | "snake"
  | "snake-complex"
  | "motif-1232"
  | "four-note-groups"
  | "thirds"
  | "fourths"
  | "sixths"
  | "triads"
  | "sevenths"
  | "alternate-picking"
  | "pedal-tone"
  | "sequence-asc"
  | "sequence-desc"
  | "skip-pattern"
  | "sweep-arp"
  | "neo-classical"
  | "power-chord"
  | "djent-palm"
  | "polyrhythm"
  | "breakdown-chug"
  | "tremolo"
  | "legato-cascade";
