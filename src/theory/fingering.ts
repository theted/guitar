// Fingering: which string and fret each note of a phrase is played on, so
// playback can light up one fret instead of every place the pitch exists.
//
// The hand starts in position 0 (at the nut) and covers a window of frets.
// Each note is taken inside the window when possible, preferring the string
// the previous note was on; the hand only shifts when a note is out of reach,
// and then by as little as possible. That's how a player would read a run:
// stay put, cross strings, shift when you must.

export type FretLocation = {
  /** Index into the open-string pitches, low string = 0 */
  stringIndex: number;
  fret: number;
};

/** Frets above the index finger the hand reaches without shifting */
const REACH = 3;
/** One fret of shift costs as much as this many string crossings */
const SHIFT_COST = 4;

type Candidate = FretLocation & { shift: number };

const shiftFor = (fret: number, hand: number): number => {
  // Open strings sound without fretting, so they're free near the nut
  if (fret === 0) return hand <= 2 ? 0 : hand;
  if (fret < hand) return hand - fret;
  if (fret > hand + REACH) return fret - (hand + REACH);
  return 0;
};

/**
 * Finger a sequence of absolute pitches on a neck.
 *
 * @param notes       absolute semitones, in playing order
 * @param baseNotes   open-string pitches, low string first (see useFretboard)
 * @param frets       highest fret on the neck
 * @returns one location per note, or null for a note the neck can't play
 */
export const fingerSequence = (
  notes: readonly number[],
  baseNotes: readonly number[],
  frets: number
): Array<FretLocation | null> => {
  let hand = 0;
  let previousString: number | null = null;

  return notes.map((abs) => {
    const candidates: Candidate[] = [];
    baseNotes.forEach((open, stringIndex) => {
      const fret = abs - open;
      if (fret >= 0 && fret <= frets) {
        candidates.push({ stringIndex, fret, shift: shiftFor(fret, hand) });
      }
    });
    if (candidates.length === 0) return null;

    const cost = (c: Candidate) =>
      c.shift * SHIFT_COST +
      (previousString === null ? c.stringIndex * 0.01 : Math.abs(c.stringIndex - previousString));

    let best = candidates[0];
    for (const candidate of candidates.slice(1)) {
      const difference = cost(candidate) - cost(best);
      // Ties go to the lower fret: stay close to the nut
      if (difference < 0 || (difference === 0 && candidate.fret < best.fret)) best = candidate;
    }

    if (best.shift > 0 && best.fret > 0) {
      hand = best.fret < hand ? best.fret : best.fret - REACH;
    }
    previousString = best.stringIndex;
    return { stringIndex: best.stringIndex, fret: best.fret };
  });
};
