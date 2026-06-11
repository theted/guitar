import type { PitchClass } from "@/types/music";
import { getScaleSpelling, formatNote } from "./spelling";

// Diatonic chords: stack alternate scale degrees (root, 3rd, 5th, 7th) and
// match the resulting interval structure against known chord qualities.

type TriadQuality = {
  symbol: string;
  /** Roman numeral casing + decoration */
  minorCase: boolean;
  decoration: "" | "°" | "+";
};

const TRIADS: Record<string, TriadQuality> = {
  "4,7": { symbol: "", minorCase: false, decoration: "" }, // major
  "3,7": { symbol: "m", minorCase: true, decoration: "" }, // minor
  "3,6": { symbol: "dim", minorCase: true, decoration: "°" }, // diminished
  "4,8": { symbol: "aug", minorCase: false, decoration: "+" }, // augmented
};

const SEVENTHS: Record<string, string> = {
  "4,7,11": "maj7",
  "4,7,10": "7",
  "3,7,10": "m7",
  "3,6,10": "m7b5",
  "3,6,9": "dim7",
  "3,7,11": "mMaj7",
  "4,8,11": "maj7#5",
  "4,8,10": "7#5",
};

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"] as const;

export type DiatonicChord = {
  /** 1-based scale degree of the chord root */
  degree: number;
  /** "ii", "V", "vii°", … */
  roman: string;
  /** "Gm", "Bb", "Bdim", … */
  name: string;
  /** "Gm7", "G7", … or null when the stacked 7th matches no known quality */
  seventhName: string | null;
  /** Triad pitch classes relative to the key tonic */
  pcs: PitchClass[];
};

/**
 * Diatonic triads (with 7th names) for a heptatonic scale; empty for scales
 * where stacked-thirds harmony doesn't apply.
 */
export const getDiatonicChords = (
  keyName: string,
  relativePcs: readonly PitchClass[]
): DiatonicChord[] => {
  if (relativePcs.length !== 7) return [];
  const spelled = getScaleSpelling(keyName, relativePcs);

  return relativePcs.map((rootRel, index) => {
    const step = (offset: number) =>
      (((relativePcs[(index + offset) % 7] - rootRel) % 12) + 12) % 12;
    const third = step(2);
    const fifth = step(4);
    const seventh = step(6);

    const triad = TRIADS[`${third},${fifth}`];
    const rootName = formatNote(spelled[index]);

    let roman: string = ROMAN[index];
    let name = rootName;
    if (triad) {
      if (triad.minorCase) roman = roman.toLowerCase();
      roman += triad.decoration;
      name += triad.symbol;
    } else {
      // Exotic stack (sus-like); present it neutrally
      roman = roman.toLowerCase();
      name += "?";
    }

    const seventhSymbol = SEVENTHS[`${third},${fifth},${seventh}`] ?? null;

    return {
      degree: index + 1,
      roman,
      name,
      seventhName: seventhSymbol ? rootName + seventhSymbol : null,
      pcs: [rootRel, ((rootRel + third) % 12) as PitchClass, ((rootRel + fifth) % 12) as PitchClass],
    };
  });
};
