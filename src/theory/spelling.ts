import type { PitchClass } from "@/types/music";

// Enharmonic spelling layer. All pitch math elsewhere in the app stays in
// E-rooted pitch classes (E = 0, matching the open low-E string); this module
// only decides how a pitch class is *written* (Bb vs A#) for a given key and
// scale.

export type NoteLetter = "C" | "D" | "E" | "F" | "G" | "A" | "B";

export interface SpelledNote {
  letter: NoteLetter;
  /** Chromatic alteration: -2 (double flat) .. +2 (double sharp) */
  accidental: number;
  /** E-rooted pitch class (app convention) */
  pc: PitchClass;
}

const LETTERS: readonly NoteLetter[] = ["C", "D", "E", "F", "G", "A", "B"];

// Natural semitone position of each letter above C
const LETTER_SEMITONE: Record<NoteLetter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

// The app's pitch classes are rooted at E; C-rooted math is converted on the way out
const E_ROOT = LETTER_SEMITONE.E;

const toAppPc = (cSemitone: number): PitchClass =>
  ((((cSemitone - E_ROOT) % 12) + 12) % 12) as PitchClass;

export const parseKey = (name: string): SpelledNote => {
  const trimmed = name.trim();
  const letter = trimmed.charAt(0).toUpperCase() as NoteLetter;
  let accidental = 0;
  for (const ch of trimmed.slice(1)) {
    if (ch === "#") accidental += 1;
    else if (ch.toLowerCase() === "b") accidental -= 1;
  }
  return { letter, accidental, pc: toAppPc(LETTER_SEMITONE[letter] + accidental) };
};

export const formatNote = (note: SpelledNote): string =>
  note.letter +
  (note.accidental > 0 ? "#".repeat(note.accidental) : "b".repeat(-note.accidental));

// Chromatic spellings used for non-scale notes and non-heptatonic scales,
// indexed by C-rooted semitone.
const SHARP_NAMES = ["c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b"];
const FLAT_NAMES = ["c", "db", "d", "eb", "e", "f", "gb", "g", "ab", "a", "bb", "b"];

const spellChromatic = (cSemitone: number, useFlats: boolean): SpelledNote => {
  const names = useFlats ? FLAT_NAMES : SHARP_NAMES;
  return parseKey(names[((cSemitone % 12) + 12) % 12]);
};

// Tier 1: every 7-note scale gets one note per letter, so degree i uses the
// letter i steps above the tonic's; the accidental absorbs the difference.
const spellHeptatonic = (
  tonic: SpelledNote,
  relativePcs: readonly PitchClass[]
): SpelledNote[] | null => {
  const tonicLetterIndex = LETTERS.indexOf(tonic.letter);
  const tonicSemitone = LETTER_SEMITONE[tonic.letter] + tonic.accidental;
  const spelled: SpelledNote[] = [];

  for (let degree = 0; degree < relativePcs.length; degree += 1) {
    const letter = LETTERS[(tonicLetterIndex + degree) % 7];
    const target = tonicSemitone + relativePcs[degree];
    let accidental = (((target - LETTER_SEMITONE[letter]) % 12) + 12) % 12;
    if (accidental > 6) accidental -= 12;
    if (Math.abs(accidental) > 2) return null;
    spelled.push({ letter, accidental, pc: toAppPc(target) });
  }

  return spelled;
};

const prefersFlats = (tonic: SpelledNote, spelledScale: SpelledNote[] | null): boolean => {
  if (spelledScale) {
    const accidentalSum = spelledScale.reduce((sum, note) => sum + note.accidental, 0);
    if (accidentalSum !== 0) return accidentalSum < 0;
  }
  if (tonic.accidental !== 0) return tonic.accidental < 0;
  return tonic.letter === "F";
};

/**
 * Spells the notes of a scale, one entry per scale degree.
 * `relativePcs` are the pitch classes relative to the tonic, as returned by
 * `getScalePitchClasses`.
 */
export const getScaleSpelling = (
  keyName: string,
  relativePcs: readonly PitchClass[]
): SpelledNote[] => {
  const tonic = parseKey(keyName);
  if (relativePcs.length === 7) {
    const heptatonic = spellHeptatonic(tonic, relativePcs);
    if (heptatonic) return heptatonic;
  }
  const useFlats = prefersFlats(tonic, null);
  const tonicSemitone = LETTER_SEMITONE[tonic.letter] + tonic.accidental;
  return relativePcs.map((pc) => spellChromatic(tonicSemitone + pc, useFlats));
};

/**
 * Spelling for all 12 pitch classes in the context of a key and scale,
 * indexed by E-rooted (app) pitch class. Scale notes are spelled by degree;
 * the rest follow the key's accidental preference.
 */
export const getSpellingMap = (
  keyName: string,
  relativePcs: readonly PitchClass[]
): SpelledNote[] => {
  const tonic = parseKey(keyName);
  const heptatonic =
    relativePcs.length === 7 ? spellHeptatonic(tonic, relativePcs) : null;
  const scaleSpelling = getScaleSpelling(keyName, relativePcs);
  const useFlats = prefersFlats(tonic, heptatonic);

  const map: SpelledNote[] = [];
  for (let appPc = 0; appPc < 12; appPc += 1) {
    map[appPc] = spellChromatic(appPc + E_ROOT, useFlats);
  }
  for (const note of scaleSpelling) {
    map[note.pc] = note;
  }
  return map;
};

/**
 * Formats an absolute semitone (E4 = 0, app convention) using a spelling map.
 * The octave number follows the letter, not the sounding pitch, so Cb5 is the
 * note sounding B4.
 */
export const formatNoteWithOctave = (
  absFromE4: number,
  spellingMap: readonly SpelledNote[]
): string => {
  const pc = ((absFromE4 % 12) + 12) % 12;
  const note = spellingMap[pc];
  const cAbs = absFromE4 + 52; // E4 sits 52 semitones above C0
  const octave = Math.floor((cAbs - note.accidental) / 12);
  return `${formatNote(note)}${octave}`;
};
