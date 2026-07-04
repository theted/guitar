import type { ScaleName } from "./scales";

// Short characteristic lines that demonstrate what a scale sounds like.
// Unlike phrase patterns (uniform steps over any scale), riffs are authored
// per scale with real rhythm: `rel` is semitones above the tonic (must be a
// scale tone — riffs.test.ts enforces it), `beats` is the length in steps of
// the global tempo, and a null `rel` is a rest.

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
  steps: RiffStep[];
};

const n = (rel: number, beats: number): RiffStep => ({ rel, beats });
const rest = (beats: number): RiffStep => ({ rel: null, beats });

export const RIFFS: Partial<Record<ScaleName, Riff[]>> = {
  major: [
    {
      id: "major-sunrise",
      name: "Sunrise melody",
      steps: [
        n(0, 1), n(4, 1), n(7, 1), n(9, 1), n(7, 1), n(4, 1), n(5, 2),
        n(4, 1), n(2, 1), n(0, 2), rest(1),
        n(7, 0.5), n(9, 0.5), n(11, 0.5), n(12, 2.5),
      ],
    },
  ],

  minor: [
    {
      id: "minor-lament",
      name: "Aeolian lament",
      steps: [
        n(12, 2), n(10, 1), n(8, 1), n(7, 2), n(5, 1), n(7, 1),
        n(8, 2), n(7, 1), n(5, 1), n(3, 2), n(2, 1), n(0, 4),
      ],
    },
  ],

  pentatonic: [
    {
      id: "pent-box-cascade",
      name: "Box cascade",
      steps: [
        n(12, 0.5), n(10, 0.5), n(7, 0.5), n(10, 0.5), n(7, 0.5), n(5, 0.5),
        n(7, 0.5), n(5, 0.5), n(3, 0.5), n(5, 0.5), n(3, 0.5), n(0, 2),
      ],
    },
    {
      id: "pent-stadium-hook",
      name: "Stadium hook",
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
      steps: [
        n(0, 1), n(3, 1), n(5, 0.5), n(6, 0.5), n(7, 2), n(10, 1),
        n(7, 1), n(6, 0.5), n(5, 0.5), n(3, 1), n(0, 3),
      ],
    },
    {
      id: "blues-shuffle",
      name: "Shuffle riff",
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
      steps: [
        n(0, 1), n(4, 0.5), n(5, 0.5), n(7, 1), n(10, 1), n(9, 1),
        n(7, 1), n(5, 0.5), n(4, 0.5), n(2, 1), n(0, 2),
      ],
    },
  ],

  "harmonic minor": [
    {
      id: "harmmin-neoclassical",
      name: "Neoclassical descent",
      steps: [
        n(12, 0.5), n(11, 0.5), n(8, 0.5), n(7, 0.5),
        n(5, 0.5), n(3, 0.5), n(2, 0.5), n(0, 0.5),
        n(11, 1), n(12, 2),
      ],
    },
  ],

  spanish: [
    {
      id: "spanish-andalusian",
      name: "Andalusian fall",
      steps: [
        n(12, 1), n(10, 1), n(8, 1), n(7, 1.5), rest(0.5),
        n(5, 1), n(4, 1), n(1, 1), n(0, 3),
      ],
    },
  ],

  hirajoshi: [
    {
      id: "hirajoshi-koto",
      name: "Koto evening",
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
      steps: [
        n(0, 0.5), n(2, 0.5), n(4, 0.5), n(6, 0.5), n(8, 0.5), n(10, 0.5),
        n(12, 2),
        n(10, 0.5), n(8, 0.5), n(6, 0.5), n(4, 0.5), n(2, 0.5), n(0, 2),
      ],
    },
  ],
};
