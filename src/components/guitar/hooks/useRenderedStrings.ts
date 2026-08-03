import { useMemo } from "react";

type UseRenderedStringsArgs = {
  /** Open-string pitches, low string first (see useFretboard) */
  baseNotes: number[];
  frets: number;
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
  baseNotes,
  frets,
  lowAtBottom,
}: UseRenderedStringsArgs): RenderedStringsResult => {
  return useMemo(() => {
    // originalIndex 0 is the highest string; baseNotes runs the other way
    const strings = baseNotes.length;
    const stringIndices = Array.from({ length: strings }, (_, index) => index);
    const ordered = lowAtBottom ? stringIndices : stringIndices.slice().reverse();
    const fretMarkers = Array.from({ length: frets + 1 }, (_, index) => index);

    const descriptors: RenderedString[] = ordered.map((originalIndex, renderIndex) => {
      const lowIndex = strings - 1 - originalIndex;
      return {
        originalIndex,
        renderIndex,
        lowIndex,
        baseNote: baseNotes[lowIndex],
        isBottom: renderIndex === ordered.length - 1,
      };
    });

    return { descriptors, fretMarkers };
  }, [baseNotes, frets, lowAtBottom]);
};

export type { RenderedString };
