import type { PitchClass } from "@/types/music";
import { mod12 } from "./pitch";
import { degreeNames, degreeSteps, formatDegree, MAJOR_DEGREE_PCS } from "./intervals";

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

const toAppPc = (cSemitone: number): PitchClass => mod12(cSemitone - E_ROOT);

/** C-rooted semitone of a spelled note (unbounded: Cb is -1, B# is 12) */
const semitoneOf = (note: Pick<SpelledNote, "letter" | "accidental">): number =>
  LETTER_SEMITONE[note.letter] + note.accidental;

const letterAbove = (tonic: SpelledNote, step: number): NoteLetter =>
  LETTERS[(LETTERS.indexOf(tonic.letter) + step) % 7];

/** Writes C-rooted pitch `cSemitone` on `letter`, with the nearest accidental */
const spellOn = (letter: NoteLetter, cSemitone: number): SpelledNote => {
  let accidental: number = mod12(cSemitone - LETTER_SEMITONE[letter]);
  if (accidental > 6) accidental -= 12;
  return { letter, accidental, pc: toAppPc(cSemitone) };
};

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

/**
 * A spelling a reader stumbles over: a double accidental, or a sharp/flat on
 * a letter that has no black key on that side (Cb, Fb, E#, B#).
 */
export const isAwkward = (note: Pick<SpelledNote, "letter" | "accidental">): boolean =>
  Math.abs(note.accidental) > 1 ||
  (note.accidental === -1 && (note.letter === "C" || note.letter === "F")) ||
  (note.accidental === 1 && (note.letter === "E" || note.letter === "B"));

// Chromatic spellings used for non-scale notes and for awkward notes of
// scales that aren't seven notes, indexed by C-rooted semitone.
const SHARP_NAMES = ["c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b"];
const FLAT_NAMES = ["c", "db", "d", "eb", "e", "f", "gb", "g", "ab", "a", "bb", "b"];

const spellChromatic = (cSemitone: number, useFlats: boolean): SpelledNote => {
  const names = useFlats ? FLAT_NAMES : SHARP_NAMES;
  return parseKey(names[mod12(cSemitone)]);
};

/** Flat keys (F and anything named with a flat) write chromatic notes as flats */
const isFlatKey = (tonic: SpelledNote): boolean =>
  tonic.accidental !== 0 ? tonic.accidental < 0 : tonic.letter === "F";

// The chromatic scale: the seven major-scale degrees as in the tonic's major
// scale, the five notes between them raised from below in sharp keys and
// lowered from above in flat keys — unless that would be awkward and the other
// way isn't (E: F not E#; Db: D not Ebb). That reproduces the plain sharp/flat
// names wherever they can be read as a degree of the key.
const spellChromaticScale = (tonic: SpelledNote): SpelledNote[] => {
  const tonicSemitone = semitoneOf(tonic);
  const flats = isFlatKey(tonic);
  return Array.from({ length: 12 }, (_, pc) => {
    const target = tonicSemitone + pc;
    const step = MAJOR_DEGREE_PCS.indexOf(pc as (typeof MAJOR_DEGREE_PCS)[number]);
    if (step >= 0) return spellOn(letterAbove(tonic, step), target);
    const below = MAJOR_DEGREE_PCS.indexOf((pc - 1) as (typeof MAJOR_DEGREE_PCS)[number]);
    const raised = spellOn(letterAbove(tonic, below), target);
    const lowered = spellOn(letterAbove(tonic, below + 1), target);
    const [preferred, other] = flats ? [lowered, raised] : [raised, lowered];
    return isAwkward(preferred) && !isAwkward(other) ? other : preferred;
  });
};

/**
 * Spells a scale literally from the given tonic, each note on the letter of
 * the degree it's read as (`degreeSteps`): seven-note scales get one letter
 * per note, smaller ones skip letters, the diminished doubles one. Awkward
 * results are kept — choosing a better tonic is `getDisplayTonic`'s job.
 */
export const spellFromTonic = (
  tonic: SpelledNote,
  relativePcs: readonly PitchClass[]
): SpelledNote[] => {
  if (relativePcs.length === 12) return spellChromaticScale(tonic);
  const tonicSemitone = semitoneOf(tonic);
  const steps = degreeSteps(relativePcs);
  return relativePcs.map((pc, index) =>
    spellOn(letterAbove(tonic, steps[index]), tonicSemitone + pc)
  );
};

/** Other names for the tonic that a key could be written in (Db ↔ C#, F# ↔ Gb) */
const enharmonicTonics = (tonic: SpelledNote): SpelledNote[] => {
  const semitone = semitoneOf(tonic);
  return LETTERS.filter((letter) => letter !== tonic.letter)
    .map((letter) => spellOn(letter, semitone))
    .filter((candidate) => !isAwkward(candidate));
};

// Sharps or flats for notes written outside the scale's letters. A seven-note
// scale votes with its own accidentals (D minor: flats, C# minor: sharps);
// other scales follow the key, so E blues' Bb doesn't turn F# into Gb.
const prefersFlats = (tonic: SpelledNote, spelledScale: readonly SpelledNote[]): boolean => {
  if (spelledScale.length === 7) {
    const accidentalSum = spelledScale.reduce((sum, note) => sum + note.accidental, 0);
    if (accidentalSum !== 0) return accidentalSum < 0;
  }
  return isFlatKey(tonic);
};

/**
 * The literal spelling from a tonic, and what is shown: seven-note scales
 * (and the chromatic) keep every note on its degree's letter even where that
 * is awkward (F# major's E#, Eb minor's Cb), as key signatures do; other
 * scales fall back to the key's sharps or flats for a note that would be
 * awkward on its degree's letter (F blues: B, not Cb, for the b5).
 */
const spellScale = (tonic: SpelledNote, relativePcs: readonly PitchClass[]) => {
  const literal = spellFromTonic(tonic, relativePcs);
  const keepsAwkward = relativePcs.length === 7 || relativePcs.length === 12;
  const useFlats = prefersFlats(tonic, literal);
  const shown = literal.map((note, index) => {
    const fallBack = keepsAwkward ? Math.abs(note.accidental) > 2 : isAwkward(note);
    if (!fallBack || relativePcs[index] === 0) return note;
    return spellChromatic(semitoneOf(tonic) + relativePcs[index], useFlats);
  });
  return { literal, shown };
};

// Lower is easier to read: first how many notes are awkward on their degree's
// letter (shown awkward, or respelled off their letter), then how many
// accidentals are shown in all (a double counts twice)
const readingCost = (tonic: SpelledNote, relativePcs: readonly PitchClass[]): [number, number] => {
  const { literal, shown } = spellScale(tonic, relativePcs);
  return [
    literal.filter(isAwkward).length,
    shown.reduce((sum, note) => sum + Math.abs(note.accidental), 0),
  ];
};

/**
 * The tonic a key is best written from for this scale — what the title should
 * say. Key signatures work this way: D♭ minor would need F♭, B♭♭ and C♭, so
 * it is written as C♯ minor; A♭ minor is G♯ minor; F♯ lydian is G♭ lydian.
 * The scale is spelled from each name of the tonic and the one with the
 * fewest awkward notes (doubles, Cb/Fb/E#/B#), then the fewest accidentals,
 * wins. Ties keep the key as given (E♭ minor stays E♭ minor, F♯ major stays
 * F♯ major). Natural keys never move: their enharmonics (Fb, B#…) are
 * themselves awkward.
 */
export const getDisplayTonic = (
  keyName: string,
  relativePcs: readonly PitchClass[]
): SpelledNote => {
  const given = parseKey(keyName);
  let best = given;
  let bestCost = readingCost(given, relativePcs);
  for (const candidate of enharmonicTonics(given)) {
    const cost = readingCost(candidate, relativePcs);
    if (cost[0] < bestCost[0] || (cost[0] === bestCost[0] && cost[1] < bestCost[1])) {
      best = candidate;
      bestCost = cost;
    }
  }
  return best;
};

/**
 * Spells the notes of a scale, one entry per scale degree, from the display
 * tonic (`getDisplayTonic`), so D♭ minor comes out as C♯ D♯ E F♯ G♯ A B.
 * `relativePcs` are the pitch classes relative to the tonic, as returned by
 * `getScalePitchClasses`.
 *
 * Every note sits on the letter of its degree (`degreeNames`), so letters and
 * degree labels agree — except where that can't be read in either name of the
 * tonic, when scales other than seven-note ones fall back to plain sharps or
 * flats (see spellScale). The chromatic scale is written with sharps in sharp
 * keys and flats in flat keys; its degree names follow (`getDegreeNames`).
 */
export const getScaleSpelling = (
  keyName: string,
  relativePcs: readonly PitchClass[]
): SpelledNote[] => spellScale(getDisplayTonic(keyName, relativePcs), relativePcs).shown;

/**
 * Degree labels for a scale in a key — what the legend and the "Degrees"
 * label mode should show. The same as `degreeNames` for every scale but the
 * chromatic, whose reading depends on the key: each label is read off the
 * letter its note is spelled on, so labels and note names always agree
 * (C chromatic: 1 ♯1 2 ♯2 3 4 ♯4 5 ♯5 6 ♯6 7; D♭: 1 ♯1 2 …; E: 1 ♭2 2 ♭3 …).
 */
export const getDegreeNames = (
  keyName: string,
  relativePcs: readonly PitchClass[]
): string[] => {
  if (relativePcs.length !== 12) return degreeNames(relativePcs);
  const tonic = getDisplayTonic(keyName, relativePcs);
  const tonicIndex = LETTERS.indexOf(tonic.letter);
  return getScaleSpelling(keyName, relativePcs).map((note, index) => {
    const step = (LETTERS.indexOf(note.letter) - tonicIndex + 7) % 7;
    return formatDegree(step, relativePcs[index] - MAJOR_DEGREE_PCS[step]);
  });
};

/**
 * Spelling for all 12 pitch classes in the context of a key and scale,
 * indexed by E-rooted (app) pitch class. Scale notes are spelled as in
 * `getScaleSpelling` (so from the display tonic); the rest follow the scale's
 * accidental preference.
 */
export const getSpellingMap = (
  keyName: string,
  relativePcs: readonly PitchClass[]
): SpelledNote[] => {
  const tonic = getDisplayTonic(keyName, relativePcs);
  const scaleSpelling = getScaleSpelling(keyName, relativePcs);
  const useFlats = prefersFlats(tonic, scaleSpelling);

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
  const note = spellingMap[mod12(absFromE4)];
  const cAbs = absFromE4 + 52; // E4 sits 52 semitones above C0
  const octave = Math.floor((cAbs - note.accidental) / 12);
  return `${formatNote(note)}${octave}`;
};
