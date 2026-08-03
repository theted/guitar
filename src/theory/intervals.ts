// Interval names by pitch-class distance from the root.
import { mod12 } from "./pitch";

export const INTERVAL_NAMES = [
  "P1", "m2", "M2", "m3", "M3", "P4", "TT", "P5", "m6", "M6", "m7", "M7",
] as const;

export const intervalName = (relativePc: number): string =>
  INTERVAL_NAMES[mod12(relativePc)];
