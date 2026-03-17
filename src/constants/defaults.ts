import type { TuningName } from "./tunings";
import type { ScaleName } from "./scales";
import type { Tone } from "./tones";

export const DEFAULTS = {
  STRINGS: 6,
  FRETS: 24,
  TUNING: "Standard" as TuningName,
  SCALE: "blues" as ScaleName,
  KEY: "e" as Tone,
};
