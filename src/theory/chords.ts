import type { PitchClass } from "@/types/music";
import { getScaleSpelling, formatNote } from "./spelling";
import { mod12 } from "./pitch";
import { formatDegree, MAJOR_DEGREE_PCS } from "./intervals";

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

type SeventhQuality = {
  symbol: string;
  /** Roman numeral casing, and what follows the numeral: ii7, viiø7, III+maj7 */
  minorCase: boolean;
  romanSuffix: string;
};

const SEVENTHS: Record<string, SeventhQuality> = {
  "4,7,11": { symbol: "maj7", minorCase: false, romanSuffix: "maj7" },
  "4,7,10": { symbol: "7", minorCase: false, romanSuffix: "7" },
  "3,7,10": { symbol: "m7", minorCase: true, romanSuffix: "7" },
  "3,6,10": { symbol: "m7b5", minorCase: true, romanSuffix: "ø7" },
  "3,6,9": { symbol: "dim7", minorCase: true, romanSuffix: "°7" },
  "3,7,11": { symbol: "mMaj7", minorCase: true, romanSuffix: "(maj7)" },
  "4,8,11": { symbol: "maj7#5", minorCase: false, romanSuffix: "+maj7" },
  "4,8,10": { symbol: "7#5", minorCase: false, romanSuffix: "+7" },
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
  /** "ii7", "V7", "viiø7", … or the triad's numeral when the 7th has no name */
  seventhRoman: string;
  /** Triad pitch classes relative to the key tonic */
  pcs: PitchClass[];
  /** The triad plus its stacked 7th */
  seventhPcs: PitchClass[];
  /** Root, 3rd, 5th and 7th, spelled in the key: ["D", "F", "A", "C"] */
  noteNames: string[];
};

/** The chord's tones: the triad, or with `sevenths` the four-note chord */
export const chordTones = (chord: DiatonicChord, sevenths: boolean): PitchClass[] =>
  sevenths ? chord.seventhPcs : chord.pcs;

/** How the chord is named in triad or seventh mode */
export const chordLabel = (chord: DiatonicChord, sevenths: boolean): { roman: string; name: string } =>
  sevenths
    ? { roman: chord.seventhRoman, name: chord.seventhName ?? chord.name }
    : { roman: chord.roman, name: chord.name };

/**
 * A chord's tones (root first, as `chordTones` gives them) stacked upward from
 * its own root, for arpeggiating.
 *
 * The tones are pitch classes, so a chord whose third or fifth crosses the
 * octave (any chord rooted near the top of the key) wraps below its root;
 * sorting those numerically would start the arpeggio on the wrong tone. The
 * offsets returned here can exceed 11 — they are positions above the tonic,
 * not pitch classes.
 */
export const getChordArpOffsets = (tones: readonly PitchClass[]): number[] => {
  const root = tones[0];
  return tones.map((pc) => root + mod12(pc - root));
};

/**
 * Each note of a seven-note scale named by its place in the chord built on
 * `chordIndex` (0-based): the chord's own tones as R, 3, 5, 7 (♭3, ♭5, ♭♭7…)
 * and the rest of the scale as the tensions above it (♭9, 11, ♯11, 13…).
 * C major's ii (Dm7) reads C D E F G A B as ♭7 R 9 ♭3 11 5 13.
 */
export const chordRelativeNames = (
  relativePcs: readonly PitchClass[],
  chordIndex: number
): string[] => {
  if (relativePcs.length !== 7) return [];
  const root = relativePcs[chordIndex];
  return relativePcs.map((pc, index) => {
    const step = (index - chordIndex + 7) % 7;
    if (step === 0) return "R";
    const accidental = mod12(pc - root) - MAJOR_DEGREE_PCS[step];
    // Even steps are chord tones (3, 5, 7); odd ones the 9th, 11th and 13th
    return formatDegree(step % 2 === 0 ? step : step + 7, accidental);
  });
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

    const quality = SEVENTHS[`${third},${fifth},${seventh}`] ?? null;
    const numeral = quality?.minorCase ? ROMAN[index].toLowerCase() : ROMAN[index];

    return {
      degree: index + 1,
      roman,
      name,
      seventhName: quality ? rootName + quality.symbol : null,
      seventhRoman: quality ? numeral + quality.romanSuffix : roman,
      pcs: [rootRel, mod12(rootRel + third), mod12(rootRel + fifth)],
      seventhPcs: [rootRel, mod12(rootRel + third), mod12(rootRel + fifth), mod12(rootRel + seventh)],
      noteNames: [0, 2, 4, 6].map((offset) => formatNote(spelled[(index + offset) % 7])),
    };
  });
};
