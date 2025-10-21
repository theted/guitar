import { useMemo } from "react";
import { getScalePitchClasses, keyToOffset } from "@/music";
import { scales } from "@/constants";
import type { ScaleName } from "@/constants";

type ScaleMap = typeof scales;

type UseStringNotesArgs = {
  note: number;
  frets: number;
  offset: number;
  scale: ScaleName;
  keyy: string;
  scaleMap?: ScaleMap;
  scaleHighlightBottomOnly: boolean;
  isBottom: boolean;
  highlightEnabled: boolean;
  octaveHighlight: boolean;
  playingAbs?: number | null;
  playingSet?: number[];
};

type FretDescriptor = {
  fret: number;
  actualNote: number;
  isSelected: boolean;
  isBase: boolean;
  showScaleHighlight: boolean;
  degree: number | null;
  isPlayingNote: boolean;
  isPlayingOctave: boolean;
};

export const useStringNotes = ({
  note,
  frets,
  offset,
  scale,
  keyy,
  scaleMap = scales,
  scaleHighlightBottomOnly,
  isBottom,
  highlightEnabled,
  octaveHighlight,
  playingAbs,
  playingSet = [],
}: UseStringNotesArgs): FretDescriptor[] => {
  return useMemo(() => {
    const descriptors: FretDescriptor[] = [];
    const pitchClasses = getScalePitchClasses(scaleMap[scale]);
    const keyOffset = keyToOffset(keyy);

    for (let fret = 0; fret <= frets; fret += 1) {
      const actualNote = note + fret + offset;
      const relativePc = (((actualNote - keyOffset) % 12) + 12) % 12;
      const isSelected = pitchClasses.includes(relativePc);
      const isBase = relativePc === 0;
      const showScaleHighlight = isSelected && (!scaleHighlightBottomOnly || isBottom);
      const degree = isSelected ? pitchClasses.indexOf(relativePc) + 1 : null;
      const isPlayingNote = highlightEnabled && playingSet.includes(actualNote);
      const isPlayingOctave =
        highlightEnabled &&
        octaveHighlight &&
        typeof playingAbs === "number" &&
        Math.floor(playingAbs / 12) === Math.floor(actualNote / 12) &&
        isSelected;

      descriptors.push({
        fret,
        actualNote,
        isSelected,
        isBase,
        showScaleHighlight,
        degree,
        isPlayingNote,
        isPlayingOctave,
      });
    }

    return descriptors;
  }, [
    note,
    frets,
    offset,
    scale,
    keyy,
    scaleMap,
    scaleHighlightBottomOnly,
    isBottom,
    highlightEnabled,
    octaveHighlight,
    playingAbs,
    playingSet,
  ]);
};

export type { FretDescriptor };
