import type { PitchClass } from "@/types/music";
import { getScaleSpelling, formatNote } from "./spelling";
import { mod12 } from "./pitch";

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
 * A chord's tones stacked upward from its own root, for arpeggiating.
 *
 * `pcs` are pitch classes, so a chord whose third or fifth crosses the octave
 * (any chord rooted near the top of the key) wraps below its root; sorting
 * those numerically would start the arpeggio on the wrong tone. The offsets
 * returned here can exceed 11 — they are positions above the tonic, not pitch
 * classes.
 */
export const getChordArpOffsets = (chord: DiatonicChord): number[] => {
  const root = chord.pcs[0];
  return chord.pcs.map((pc) => root + mod12(pc - root));
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
    const step = (offset: number) => mod12(relativePcs[(index + offset) % 7] - rootRel);
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
      pcs: [rootRel, mod12(rootRel + third), mod12(rootRel + fifth)],
    };
  });
};
