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

/**
 * How a selected chord is arpeggiated. These run over the chord's tones only
 * (2 or 3 notes to the octave… 3 or 4), so they are kept apart from the scale
 * patterns rather than offered for both.
 */
export type ArpShape = "straight" | "inversions" | "rolling" | "skips" | "pedal";

export const ARP_SHAPES: ReadonlyArray<{ value: ArpShape; label: string; title: string }> = [
  { value: "straight", label: "Straight", title: "R 3 5 R 3 5 …" },
  { value: "inversions", label: "Inversions", title: "R 3 5 · 3 5 R · 5 R 3 …" },
  { value: "rolling", label: "Rolling", title: "R 3 5 3 · 3 5 R 5 · 5 R 3 R …" },
  { value: "skips", label: "Skips", title: "R 5 · 3 R · 5 3 …" },
  { value: "pedal", label: "Root pedal", title: "R 3 R 5 R 3 R 5 …" },
];

// Display metadata for the phrase picker, grouped by playing style.
export const PHRASE_MODE_GROUPS: ReadonlyArray<{
  label: string;
  modes: ReadonlyArray<{ value: PhraseMode; label: string }>;
}> = [
  {
    label: "Scale runs",
    modes: [
      { value: "full-scale", label: "Full scale" },
      { value: "snake", label: "Snake pattern" },
      { value: "snake-complex", label: "Snake complex" },
      { value: "motif-1232", label: "1-2-3-2 motif" },
    ],
  },
  {
    label: "Intervals",
    modes: [
      { value: "thirds", label: "Thirds" },
      { value: "fourths", label: "Fourths" },
      { value: "sixths", label: "Sixths" },
      { value: "four-note-groups", label: "Four note groups" },
    ],
  },
  {
    label: "Arpeggios",
    modes: [
      { value: "triads", label: "Triads" },
      { value: "sevenths", label: "Sevenths" },
      { value: "sweep-arp", label: "Sweep arpeggio" },
      { value: "neo-classical", label: "Neo-classical" },
    ],
  },
  {
    label: "Technique",
    modes: [
      { value: "alternate-picking", label: "Alternate picking" },
      { value: "pedal-tone", label: "Pedal tone" },
      { value: "sequence-asc", label: "Sequence up" },
      { value: "sequence-desc", label: "Sequence down" },
      { value: "skip-pattern", label: "Skip pattern" },
    ],
  },
  {
    label: "Metal",
    modes: [
      { value: "power-chord", label: "Power chord" },
      { value: "djent-palm", label: "Djent palm mute" },
      { value: "polyrhythm", label: "Polyrhythm 7/4" },
      { value: "breakdown-chug", label: "Breakdown chug" },
      { value: "tremolo", label: "Tremolo picking" },
      { value: "legato-cascade", label: "Legato cascade" },
    ],
  },
];
