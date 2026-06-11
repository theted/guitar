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
  | "legato-cascade"
  | "chord-arp";

// Display metadata for the phrase picker, grouped by playing style.
export const PHRASE_MODE_GROUPS: ReadonlyArray<{
  label: string;
  modes: ReadonlyArray<{ value: PhraseMode; label: string }>;
}> = [
  {
    label: "Scale runs",
    modes: [
      { value: "full-scale", label: "📈 Full Scale" },
      { value: "snake", label: "🐍 Snake Pattern" },
      { value: "snake-complex", label: "🐍 Snake Complex" },
      { value: "motif-1232", label: "🎵 1-2-3-2 Motif" },
    ],
  },
  {
    label: "Intervals",
    modes: [
      { value: "thirds", label: "🎼 Thirds" },
      { value: "fourths", label: "🎼 Fourths" },
      { value: "sixths", label: "🎼 Sixths" },
      { value: "four-note-groups", label: "🎼 Four Note Groups" },
    ],
  },
  {
    label: "Arpeggios",
    modes: [
      { value: "chord-arp", label: "🎹 Chord Arpeggio" },
      { value: "triads", label: "🎹 Triads" },
      { value: "sevenths", label: "🎹 Sevenths" },
      { value: "sweep-arp", label: "🎸 Sweep Arpeggio" },
      { value: "neo-classical", label: "🎸 Neo-Classical" },
    ],
  },
  {
    label: "Technique",
    modes: [
      { value: "alternate-picking", label: "🎸 Alternate Picking" },
      { value: "pedal-tone", label: "🎸 Pedal Tone" },
      { value: "sequence-asc", label: "🎸 Sequence Up" },
      { value: "sequence-desc", label: "🎸 Sequence Down" },
      { value: "skip-pattern", label: "🎸 Skip Pattern" },
    ],
  },
  {
    label: "Metal",
    modes: [
      { value: "power-chord", label: "🎸 Power Chord" },
      { value: "djent-palm", label: "🤘 Djent Palm Mute" },
      { value: "polyrhythm", label: "🤘 Polyrhythm 7/4" },
      { value: "breakdown-chug", label: "🤘 Breakdown Chug" },
      { value: "tremolo", label: "🤘 Tremolo Picking" },
      { value: "legato-cascade", label: "🤘 Legato Cascade" },
    ],
  },
];
