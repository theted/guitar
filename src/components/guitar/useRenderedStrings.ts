import { useMemo } from "react";
import { keyToOffset } from "@/music";
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

    const tuning = tunings[tuningName];
    const tuningPitchClasses = tuning.map((tone) => keyToOffset(tone));
    const absBaseByTuningIndex: number[] = new Array(tuningPitchClasses.length);

    if (tuningPitchClasses.length > 0) {
      const lastIndex = tuningPitchClasses.length - 1;
      const highestPitchClass = tuningPitchClasses[lastIndex];
      const anchorEAbs = 12 * (startOctave - 4);
      absBaseByTuningIndex[lastIndex] = anchorEAbs + highestPitchClass;

      for (let s = lastIndex - 1; s >= 0; s -= 1) {
        const pitchClass = tuningPitchClasses[s];
        const above = absBaseByTuningIndex[s + 1];
        let candidate = pitchClass;

        while (candidate >= above) candidate -= 12;
        while (candidate + 12 < above) candidate += 12;

        absBaseByTuningIndex[s] = candidate;
      }
    }

    const descriptors: RenderedString[] = ordered.map((originalIndex, renderIndex) => {
      if (tuning.length === 0) {
        return {
          originalIndex,
          renderIndex,
          baseNote: 0,
          isBottom: renderIndex === ordered.length - 1,
        };
      }

      const tuningIndex = tuning.length - 1 - (originalIndex % tuning.length);
      const cycle = Math.floor(originalIndex / tuning.length);
      const baseNote = absBaseByTuningIndex[tuningIndex] - cycle * 12;

      return {
        originalIndex,
        renderIndex,
        baseNote,
        isBottom: renderIndex === ordered.length - 1,
      };
    });

    return { descriptors, fretMarkers };
  }, [strings, frets, tuningName, startOctave, lowAtBottom]);
};

export type { RenderedString };
