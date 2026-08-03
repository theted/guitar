// Tunings are pitch classes only; the renderer stacks each string in the
// octave below its neighbor, so tunings that differ from another one purely
// by octave (Nashville, baritone) are not representable and are not listed.
export const tunings = {
  // Standard tunings
  Standard: ["e", "a", "d", "g", "b", "e"],
  "Eb Standard": ["d#", "g#", "c#", "f#", "a#", "d#"],
  "D Standard": ["d", "g", "c", "f", "a", "d"],
  "C Standard": ["c", "f", "a#", "d#", "g", "c"],
  "B Standard": ["b", "e", "a", "d", "f#", "b"],
  "A Standard": ["a", "d", "g", "c", "e", "a"],

  // Drop tunings
  "Drop D": ["d", "a", "d", "g", "b", "e"],
  "Eb Drop D": ["c#", "g#", "c#", "f#", "a#", "d#"],
  "Drop C": ["c", "g", "c", "f", "a", "d"],
  "Drop B": ["b", "f#", "b", "e", "g#", "c#"],
  "Drop A": ["a", "e", "a", "d", "f#", "b"],

  // Open tunings
  "Open A": ["e", "a", "c#", "e", "a", "e"],
  "Open C": ["c", "g", "c", "g", "c", "e"],
  "Open D": ["d", "a", "d", "f#", "a", "d"],
  "Open E": ["e", "b", "e", "g#", "b", "e"],
  "Open G": ["d", "g", "d", "g", "b", "d"],

  // Modal/Celtic tunings
  DADGAD: ["d", "a", "d", "g", "a", "d"],

  // Extended range
  "7-String Standard": ["b", "e", "a", "d", "g", "b", "e"],
  "7-String Drop A": ["a", "e", "a", "d", "g", "b", "e"],
  "8-String": ["f#", "b", "e", "a", "d", "g", "b", "e"],

  // Bass tunings (4-string)
  "Bass Standard": ["e", "a", "d", "g"],
  "Bass Drop D": ["d", "a", "d", "g"],
  "Bass Drop C": ["c", "g", "c", "f"],

  // Experimental/Alternative
  "All Fourths": ["e", "a", "d", "g", "c", "f"],
  "New Standard": ["c", "g", "d", "a", "e", "g"],
  Russian: ["d", "g", "b", "e", "a", "d"],
  Ostrich: ["d", "d", "d", "d", "d", "d"],
  DEAD: ["d", "e", "a", "d"],
} as const;

export type TuningName = keyof typeof tunings;

// Display metadata for the tuning picker (same shape as PHRASE_MODE_GROUPS).
// Every tuning in the catalog must appear exactly once.
export const TUNING_GROUPS: ReadonlyArray<{
  label: string;
  tunings: ReadonlyArray<TuningName>;
}> = [
  {
    label: "Standard",
    tunings: ["Standard", "Eb Standard", "D Standard", "C Standard", "B Standard", "A Standard"],
  },
  {
    label: "Drop",
    tunings: ["Drop D", "Eb Drop D", "Drop C", "Drop B", "Drop A"],
  },
  {
    label: "Open",
    tunings: ["Open A", "Open C", "Open D", "Open E", "Open G"],
  },
  {
    label: "Extended range",
    tunings: ["7-String Standard", "7-String Drop A", "8-String"],
  },
  {
    label: "Bass",
    tunings: ["Bass Standard", "Bass Drop D", "Bass Drop C"],
  },
  {
    label: "Other",
    tunings: ["DADGAD", "All Fourths", "New Standard", "Russian", "Ostrich", "DEAD"],
  },
];
