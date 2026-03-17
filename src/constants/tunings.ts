import type { Tone } from "./tones";

export const tunings = {
  // Standard tunings
  Standard: ["e", "a", "d", "g", "b", "e"],

  // Drop tunings
  "Drop D": ["d", "a", "d", "g", "b", "e"],
  "Drop C": ["c", "g", "c", "f", "a", "d"],
  "Drop B": ["b", "f#", "b", "e", "g#", "c#"],
  "Drop A": ["a", "e", "a", "d", "f#", "b"],

  // Half-step down variants
  "Eb Standard": ["d#", "g#", "c#", "f#", "a#", "d#"],
  "Eb Drop D": ["c#", "g#", "c#", "f#", "a#", "d#"],

  // Whole-step down
  "D Standard": ["d", "g", "c", "f", "a", "d"],

  // Open tunings
  "Open A": ["e", "a", "c#", "e", "a", "e"],
  "Open D": ["d", "a", "d", "f#", "a", "d"],
  "Open E": ["e", "b", "e", "g#", "b", "e"],
  "Open G": ["d", "g", "d", "g", "b", "d"],
  "Open C": ["c", "g", "c", "g", "c", "e"],

  // Modal/Celtic tunings
  DADGAD: ["d", "a", "d", "g", "a", "d"],
  DADGBE: ["d", "a", "d", "g", "b", "e"],
  DGDGBD: ["d", "g", "d", "g", "b", "d"],

  // Metal/Heavy tunings
  "C Standard": ["c", "f", "a#", "d#", "g", "c"],
  "B Standard": ["b", "e", "a", "d", "f#", "b"],
  "A Standard": ["a", "d", "g", "c", "e", "a"],

  // Nashville High Strung
  Nashville: ["e", "a", "d", "g", "b", "e"],

  // Baritone guitar
  "Baritone B": ["b", "e", "a", "d", "f#", "b"],
  "Baritone A": ["a", "d", "g", "c", "e", "a"],

  // 7-string tunings
  "7-String Standard": ["b", "e", "a", "d", "g", "b", "e"],
  "7-String Drop A": ["a", "e", "a", "d", "g", "b", "e"],

  // Extended range
  "8-String": ["f#", "b", "e", "a", "d", "g", "b", "e"],

  // Experimental/Alternative
  "All Fourths": ["e", "a", "d", "g", "c", "f"],
  "New Standard": ["c", "g", "d", "a", "e", "g"],
  Ostrich: ["d", "d", "d", "d", "d", "d"],

  // Bass tunings (4-string)
  "Bass Standard": ["e", "a", "d", "g"],
  "Bass Drop D": ["d", "a", "d", "g"],
  "Bass Drop C": ["c", "g", "c", "f"],

  // Special/Ethnic
  Russian: ["d", "g", "b", "e", "a", "d"],
  DEAD: ["d", "e", "a"],
} as const;

export type TuningName = keyof typeof tunings;
export type Tuning = readonly Tone[];
