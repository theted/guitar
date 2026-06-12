import { useMemo } from "react";
import { getStringBaseNotes } from "@/theory/positions";
import { tunings, type TuningName } from "@/constants";

type UseRenderedStringsArgs = {
  strings: number;
  frets: number;
  tuningName: TuningName;
  startOctave: number;
  lowAtBottom: boolean;
};

type RenderedString = {
  originalIndex: number;
  renderIndex: number;
  /** Index into the low→high string order (0 = lowest string) */
  lowIndex: number;
  baseNote: number;
  isBottom: boolean;
};

type RenderedStringsResult = {
  descriptors: RenderedString[];
  fretMarkers: number[];
};

export const useRenderedStrings = ({
  strings,
  frets,
  tuningName,
  startOctave,
  lowAtBottom,
}: UseRenderedStringsArgs): RenderedStringsResult => {
  return useMemo(() => {
    const stringIndices = Array.from({ length: strings }, (_, index) => index);
    const ordered = lowAtBottom ? stringIndices : stringIndices.slice().reverse();
    const fretMarkers = Array.from({ length: frets + 1 }, (_, index) => index);

    // Low→high base pitches; originalIndex 0 is the highest string
    const baseNotesLowToHigh = getStringBaseNotes(tunings[tuningName], strings, startOctave);

    const descriptors: RenderedString[] = ordered.map((originalIndex, renderIndex) => {
      const lowIndex = strings - 1 - originalIndex;
      return {
        originalIndex,
        renderIndex,
        lowIndex,
        baseNote: baseNotesLowToHigh[lowIndex],
        isBottom: renderIndex === ordered.length - 1,
      };
    });

    return { descriptors, fretMarkers };
  }, [strings, frets, tuningName, startOctave, lowAtBottom]);
};

export type { RenderedString };
