import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { getStringBaseNotes, getFretboardRange } from "@/theory/positions";
import { tunings } from "@/constants";
import { useFormStore } from "@/store";

export type Fretboard = {
  /** Open-string pitches (abs semitones from E4), low string first */
  baseNotes: number[];
  frets: number;
  /** Open pitch of the lowest string */
  lowest: number;
  /** Top fret of the highest string */
  highest: number;
};

/**
 * The geometry of the neck currently on screen. Anything that has to agree with
 * what the user sees — the rendered strings, the position boxes, the range a
 * phrase is laid out in — reads it from here.
 */
export const useFretboard = (): Fretboard => {
  const { tuningName, strings, frets, startOctave } = useFormStore(
    useShallow((state) => ({
      tuningName: state.tuningName,
      strings: state.strings,
      frets: state.frets,
      startOctave: state.startOctave,
    }))
  );

  return useMemo(() => {
    const baseNotes = getStringBaseNotes(tunings[tuningName], strings, startOctave);
    return { baseNotes, frets, ...getFretboardRange(baseNotes, frets) };
  }, [tuningName, strings, frets, startOctave]);
};
