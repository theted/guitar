import { keyToOffset } from "@/music";
import type { PitchClass } from "@/types/music";

// Box-position engine: a position is every scale note inside a fixed fret
// window (one hand location), anchored on each scale tone of the lowest
// string within the first octave — the construction behind the classic
// 5 pentatonic boxes / 7 diatonic positions. Playability falls out of the
// window width; no per-transition stretch analysis needed.

export type PositionNote = {
  /** Index into stringBaseNotes (low string = 0), independent of render order */
  stringIndex: number;
  fret: number;
  abs: number;
};

export type ScalePosition = {
  /** 1-based, ordered by lowFret */
  index: number;
  lowFret: number;
  highFret: number;
  /** Strictly ascending pitch — the practice path */
  notes: PositionNote[];
};

/**
 * Open-string pitches (abs semitones from E4) ordered LOW string first.
 * Same placement rules as the fretboard renderer: the highest string anchors
 * at the start octave and each lower string sits within the octave below its
 * neighbor; extra strings beyond the tuning cycle an octave down.
 */
export const getStringBaseNotes = (
  tuning: readonly string[],
  strings: number,
  startOctave: number
): number[] => {
  const pitchClasses = tuning.map((t) => keyToOffset(t) as number);
  if (pitchClasses.length === 0) return [];

  const absBaseByTuningIndex: number[] = new Array(pitchClasses.length);
  const lastIndex = pitchClasses.length - 1;
  const anchorEAbs = 12 * (startOctave - 4);
  absBaseByTuningIndex[lastIndex] = anchorEAbs + pitchClasses[lastIndex];

  for (let s = lastIndex - 1; s >= 0; s -= 1) {
    const above = absBaseByTuningIndex[s + 1];
    let candidate: number = pitchClasses[s];
    while (candidate >= above) candidate -= 12;
    while (candidate + 12 < above) candidate += 12;
    absBaseByTuningIndex[s] = candidate;
  }

  const byOriginalIndex: number[] = [];
  for (let originalIndex = 0; originalIndex < strings; originalIndex += 1) {
    const tuningIndex = pitchClasses.length - 1 - (originalIndex % pitchClasses.length);
    const cycle = Math.floor(originalIndex / pitchClasses.length);
    byOriginalIndex.push(absBaseByTuningIndex[tuningIndex] - cycle * 12);
  }
  return byOriginalIndex.reverse();
};

type GetScalePositionsArgs = {
  /** Open-string pitches (abs semitones from E4), low string first */
  stringBaseNotes: number[];
  frets: number;
  keyOffset: number;
  scalePcs: readonly PitchClass[];
  /** Window width in frets (hand span), default 5 */
  span?: number;
};

export const getScalePositions = ({
  stringBaseNotes,
  frets,
  keyOffset,
  scalePcs,
  span = 5,
}: GetScalePositionsArgs): ScalePosition[] => {
  if (stringBaseNotes.length === 0 || scalePcs.length === 0) return [];

  const inScale = (abs: number) =>
    scalePcs.includes(((((abs - keyOffset) % 12) + 12) % 12) as PitchClass);

  // One anchor per scale tone on the lowest string, within the first octave
  // (positions repeat an octave up from there).
  const anchors: number[] = [];
  for (let fret = 0; fret < Math.min(12, frets + 1); fret += 1) {
    if (inScale(stringBaseNotes[0] + fret)) anchors.push(fret);
  }

  const positions: ScalePosition[] = [];
  const seen = new Set<string>();

  for (const anchor of anchors) {
    const lowFret = anchor;
    const highFret = Math.min(anchor + span - 1, frets);
    if (highFret < lowFret) continue;

    const fretsPerString = stringBaseNotes.map((base) => {
      const found: number[] = [];
      for (let fret = lowFret; fret <= highFret; fret += 1) {
        if (inScale(base + fret)) found.push(fret);
      }
      return found;
    });

    // Each pitch appears once: a string only keeps notes below the next
    // sounding string's first in-window note (textbook box construction —
    // unisons move to the higher string).
    const notes: PositionNote[] = [];
    for (let s = 0; s < fretsPerString.length; s += 1) {
      let cap = Infinity;
      for (let t = s + 1; t < fretsPerString.length; t += 1) {
        if (fretsPerString[t].length > 0) {
          cap = stringBaseNotes[t] + fretsPerString[t][0];
          break;
        }
      }
      for (const fret of fretsPerString[s]) {
        const abs = stringBaseNotes[s] + fret;
        if (abs < cap) notes.push({ stringIndex: s, fret, abs });
      }
    }

    if (notes.length === 0) continue;
    const signature = notes.map((n) => `${n.stringIndex}.${n.fret}`).join(",");
    if (seen.has(signature)) continue;
    seen.add(signature);

    positions.push({ index: positions.length + 1, lowFret, highFret, notes });
  }

  return positions;
};
