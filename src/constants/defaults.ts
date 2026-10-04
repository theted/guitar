import type { TuningName } from "./tunings";
import type { ScaleName } from "./scales";
import type { KeyName } from "./tones";

export const DEFAULTS = {
  STRINGS: 6,
  FRETS: 24,
  TUNING: "Standard" as TuningName,
  SCALE: "blues" as ScaleName,
  KEY: "e" as KeyName,
};

/** Tempo range in bpm, and the step for −/+ and the arrow keys */
export const TEMPO = { MIN: 30, MAX: 700, STEP: 5 } as const;

export const clampTempo = (bpm: number): number => Math.min(TEMPO.MAX, Math.max(TEMPO.MIN, bpm));
