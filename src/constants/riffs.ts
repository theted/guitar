import type { ScaleName } from "./scales";

// Short characteristic lines that demonstrate what a scale sounds like.
// Unlike phrase patterns (uniform steps over any scale), riffs are authored
// per scale with real rhythm: `rel` is semitones above the tonic (must be a
// scale tone — riffs.test.ts enforces it), `beats` is the length in steps of
// the tempo, and a null `rel` is a rest. `bpm` is the tempo the line was
// written for; selecting a riff adopts it (the slider stays in control).

export type RiffStep = {
  /** Semitones above the tonic, or null for a rest */
  rel: number | null;
  /** Duration in steps (one step = 60000/bpm ms, same clock as phrases) */
  beats: number;
};

export type Riff = {
  /** Globally unique id (persisted in selectedRiffId) */
  id: string;
  name: string;
  /** Suggested tempo in the app's step-bpm units; applied on selection */
  bpm: number;
  steps: RiffStep[];
};

const n = (rel: number, beats: number): RiffStep => ({ rel, beats });
const rest = (beats: number): RiffStep => ({ rel: null, beats });

export const RIFFS: Partial<Record<ScaleName, Riff[]>> = {
  major: [
    {
      id: "major-sunrise",
      name: "Sunrise melody",
      bpm: 260,
      steps: [
        n(0, 1), n(4, 1), n(7, 1), n(9, 1), n(7, 1), n(4, 1), n(5, 2),
        n(4, 1), n(2, 1), n(0, 2), rest(1),
        n(7, 0.5), n(9, 0.5), n(11, 0.5), n(12, 2.5),
      ],
    },
    {
      id: "major-pop-cadence",
      name: "Pop cadence",
      bpm: 280,
      steps: [
        n(0, 0.5), n(4, 0.5), n(7, 1), n(9, 0.5), n(7, 0.5), n(5, 1),
        n(4, 0.5), n(2, 0.5), n(4, 2), rest(0.5),
        n(0, 0.5), n(2, 0.5), n(4, 0.5), n(5, 0.5), n(7, 2.5),
      ],
    },
  ],

  minor: [
    {
      id: "minor-lament",
      name: "Aeolian lament",
      bpm: 220,
      steps: [
        n(12, 2), n(10, 1), n(8, 1), n(7, 2), n(5, 1), n(7, 1),
        n(8, 2), n(7, 1), n(5, 1), n(3, 2), n(2, 1), n(0, 4),
      ],
    },
    {
      id: "minor-doom-bell",
      name: "Doom bell",
      bpm: 120,
      steps: [
        n(0, 2), n(0, 1), n(12, 1), n(10, 2), n(8, 2), n(7, 2), n(0, 4),
      ],
    },
  ],

  pentatonic: [
    {
      id: "pent-box-cascade",
      name: "Box cascade",
      bpm: 360,
      steps: [
        n(12, 0.5), n(10, 0.5), n(7, 0.5), n(10, 0.5), n(7, 0.5), n(5, 0.5),
        n(7, 0.5), n(5, 0.5), n(3, 0.5), n(5, 0.5), n(3, 0.5), n(0, 2),
      ],
    },
    {
      id: "pent-stadium-hook",
      name: "Stadium hook",
      bpm: 280,
      steps: [
        n(0, 1.5), n(0, 0.5), n(3, 1), n(5, 1),
        n(7, 1.5), n(7, 0.5), n(5, 1), n(3, 1), n(0, 3),
      ],
    },
  ],

  "pentatonic major": [
    {
      id: "pentmaj-porch-swing",
      name: "Porch swing",
      bpm: 280,
      steps: [
        n(0, 0.5), n(2, 0.5), n(4, 1), n(7, 1), n(4, 0.5), n(2, 0.5), n(4, 2),
        rest(0.5), n(9, 1), n(7, 1), n(4, 1), n(2, 0.5), n(0, 2.5),
      ],
    },
  ],

  blues: [
    {
      id: "blues-slow-bend",
      name: "Slow-bend lick",
      bpm: 200,
      steps: [
        n(0, 1), n(3, 1), n(5, 0.5), n(6, 0.5), n(7, 2), n(10, 1),
        n(7, 1), n(6, 0.5), n(5, 0.5), n(3, 1), n(0, 3),
      ],
    },
    {
      id: "blues-shuffle",
      name: "Shuffle riff",
      bpm: 260,
      steps: [
        n(0, 1), rest(0.5), n(3, 0.5), n(5, 0.5), n(6, 0.5), n(7, 1),
        rest(0.5), n(7, 0.5), n(10, 0.5), n(7, 0.5), n(6, 0.5), n(5, 0.5),
        n(3, 1), n(0, 2),
      ],
    },
  ],

  dorian: [
    {
      id: "dorian-funk-vamp",
      name: "Funk vamp",
      bpm: 320,
      steps: [
        n(0, 0.5), rest(0.5), n(0, 0.5), n(3, 0.5), n(5, 1), n(9, 1),
        n(7, 0.5), n(5, 0.5), n(3, 0.5), n(2, 0.5), n(0, 2),
      ],
    },
  ],

  phrygian: [
    {
      id: "phrygian-gallop",
      name: "Gallop of doom",
      bpm: 400,
      steps: [
        n(0, 0.5), n(0, 0.25), n(0, 0.25), n(1, 1),
        n(0, 0.5), n(0, 0.25), n(0, 0.25), n(3, 1),
        n(0, 0.5), n(0, 0.25), n(0, 0.25), n(1, 0.5), n(3, 0.5), n(1, 0.5),
        n(0, 1.5),
      ],
    },
  ],

  lydian: [
    {
      id: "lydian-floating-fourth",
      name: "Floating fourth",
      bpm: 240,
      steps: [
        n(0, 1), n(4, 1), n(6, 2), n(7, 1), n(11, 1), n(12, 2),
        n(11, 1), n(9, 1), n(7, 1), n(6, 1), n(4, 1), n(0, 3),
      ],
    },
  ],

  mixolydian: [
    {
      id: "mixo-barroom-rock",
      name: "Barroom rock",
      bpm: 300,
      steps: [
        n(0, 1), n(4, 0.5), n(5, 0.5), n(7, 1), n(10, 1), n(9, 1),
        n(7, 1), n(5, 0.5), n(4, 0.5), n(2, 1), n(0, 2),
      ],
    },
  ],

  locrian: [
    {
      id: "locrian-tritone-lurch",
      name: "Tritone lurch",
      bpm: 320,
      steps: [
        n(0, 0.5), n(0, 0.5), n(6, 1), n(0, 0.5), n(0, 0.5),
        n(5, 0.5), n(6, 0.5), n(8, 1),
        n(6, 0.5), n(5, 0.5), n(3, 0.5), n(1, 0.5), n(0, 2),
      ],
    },
  ],

  "harmonic minor": [
    {
      id: "harmmin-neoclassical",
      name: "Neoclassical descent",
      bpm: 480,
      steps: [
        n(12, 0.5), n(11, 0.5), n(8, 0.5), n(7, 0.5),
        n(5, 0.5), n(3, 0.5), n(2, 0.5), n(0, 0.5),
        n(11, 1), n(12, 2),
      ],
    },
    {
      id: "harmmin-phantom-waltz",
      name: "Phantom waltz",
      bpm: 260,
      steps: [
        n(0, 1), n(3, 0.5), n(2, 0.5), n(3, 1), n(8, 1), n(7, 2),
        n(5, 1), n(3, 1), n(2, 1), n(11, 1), n(12, 2),
      ],
    },
  ],

  "harmonic major": [
    {
      id: "harmmaj-golden-hour",
      name: "Golden hour",
      bpm: 240,
      steps: [
        n(0, 1), n(4, 1), n(7, 1), n(8, 2), n(7, 1), n(5, 1),
        n(4, 1), n(2, 1), n(0, 2), rest(0.5), n(11, 1), n(12, 3),
      ],
    },
  ],

  arabian: [
    {
      id: "arabian-caravan",
      name: "Caravan",
      bpm: 260,
      steps: [
        n(0, 1), n(2, 1), n(4, 1), n(5, 1), n(6, 2), n(5, 1), n(4, 1),
        n(2, 1), n(0, 2), rest(0.5),
        n(8, 1), n(6, 1), n(5, 1), n(4, 0.5), n(2, 0.5), n(0, 3),
      ],
    },
  ],

  persian: [
    {
      id: "persian-mirage",
      name: "Desert mirage",
      bpm: 220,
      steps: [
        n(0, 1), n(1, 1), n(4, 2), n(5, 1), n(6, 1), n(5, 1), n(4, 1),
        n(1, 1), n(0, 2), n(11, 1), n(12, 2),
      ],
    },
  ],

  "double harmonic": [
    {
      id: "dblharm-byzantine",
      name: "Byzantine march",
      bpm: 260,
      steps: [
        n(0, 1), n(1, 1), n(4, 1), n(5, 1), n(4, 1), n(1, 1), n(0, 1),
        n(11, 1), n(12, 2), rest(0.5),
        n(8, 1), n(7, 1), n(5, 1), n(4, 0.5), n(1, 0.5), n(0, 3),
      ],
    },
  ],

  hungarian: [
    {
      id: "hungarian-csardas",
      name: "Csárdás spin",
      bpm: 320,
      steps: [
        n(0, 1), n(2, 0.5), n(3, 0.5), n(6, 1), n(7, 1), n(8, 1),
        n(7, 1), n(6, 0.5), n(3, 0.5), n(2, 1), n(0, 2),
      ],
    },
  ],

  spanish: [
    {
      id: "spanish-andalusian",
      name: "Andalusian fall",
      bpm: 240,
      steps: [
        n(12, 1), n(10, 1), n(8, 1), n(7, 1.5), rest(0.5),
        n(5, 1), n(4, 1), n(1, 1), n(0, 3),
      ],
    },
  ],

  japanese: [
    {
      id: "japanese-insen-breeze",
      name: "In-sen breeze",
      bpm: 200,
      steps: [
        n(0, 1), n(1, 1), n(5, 2), n(7, 1), n(8, 1), n(7, 2),
        n(5, 1), n(1, 1), n(0, 4),
      ],
    },
  ],

  hirajoshi: [
    {
      id: "hirajoshi-koto",
      name: "Koto evening",
      bpm: 200,
      steps: [
        n(0, 1), n(2, 1), n(3, 2), n(7, 1), n(8, 1), n(12, 2),
        n(8, 1), n(7, 1), n(3, 1), n(2, 1), n(0, 4),
      ],
    },
  ],

  "whole tone": [
    {
      id: "wholetone-dream",
      name: "Dream sequence",
      bpm: 240,
      steps: [
        n(0, 0.5), n(2, 0.5), n(4, 0.5), n(6, 0.5), n(8, 0.5), n(10, 0.5),
        n(12, 2),
        n(10, 0.5), n(8, 0.5), n(6, 0.5), n(4, 0.5), n(2, 0.5), n(0, 2),
      ],
    },
  ],

  diminished: [
    {
      id: "dim-spiral",
      name: "Spiral staircase",
      bpm: 340,
      steps: [
        n(0, 0.5), n(1, 0.5), n(3, 0.5), n(4, 0.5),
        n(6, 0.5), n(7, 0.5), n(9, 0.5), n(10, 0.5), n(12, 2),
        n(10, 0.5), n(9, 0.5), n(7, 0.5), n(6, 0.5),
        n(4, 0.5), n(3, 0.5), n(1, 0.5), n(0, 2),
      ],
    },
  ],

  chromatic: [
    {
      id: "chromatic-spy-crawl",
      name: "Spy crawl",
      bpm: 280,
      steps: [
        n(0, 1), n(1, 0.5), n(2, 0.5), n(3, 1), n(7, 1),
        n(6, 0.5), n(5, 0.5), n(4, 1), n(0, 2),
      ],
    },
  ],

  "minor thirds": [
    {
      id: "minthirds-alarm",
      name: "Dim-seventh alarm",
      bpm: 340,
      steps: [
        n(0, 0.5), n(3, 0.5), n(6, 0.5), n(9, 0.5), n(12, 1),
        n(9, 0.5), n(6, 0.5), n(3, 0.5), n(0, 1.5),
      ],
    },
  ],

  "major thirds": [
    {
      id: "majthirds-drift",
      name: "Augmented drift",
      bpm: 200,
      steps: [
        n(0, 1), n(4, 1), n(8, 1), n(12, 2), n(8, 1), n(4, 1), n(0, 3),
      ],
    },
  ],
};
