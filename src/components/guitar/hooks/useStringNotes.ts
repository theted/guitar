import { useMemo } from "react";
import { getScalePitchClasses, keyToOffset } from "@/music";
import { scales } from "@/constants";
import { pitchClass as asPitchClass } from "@/types";
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
};

type FretDescriptor = {
  fret: number;
  actualNote: number;
  isSelected: boolean;
  isBase: boolean;
  showScaleHighlight: boolean;
  degree: number | null;
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
}: UseStringNotesArgs): FretDescriptor[] => {
  return useMemo(() => {
    const descriptors: FretDescriptor[] = [];
    const pitchClasses = getScalePitchClasses(scaleMap[scale]);
    const keyOffset = keyToOffset(keyy);

    for (let fret = 0; fret <= frets; fret += 1) {
      const actualNote = note + fret + offset;
      const relativePc = asPitchClass((((actualNote - keyOffset) % 12) + 12) % 12);
      const isSelected = pitchClasses.includes(relativePc);
      const isBase = relativePc === 0;
      const showScaleHighlight = isSelected && (!scaleHighlightBottomOnly || isBottom);
      const degree = isSelected ? pitchClasses.indexOf(relativePc) + 1 : null;

      descriptors.push({ fret, actualNote, isSelected, isBase, showScaleHighlight, degree });
    }

    return descriptors;
  }, [note, frets, offset, scale, keyy, scaleMap, scaleHighlightBottomOnly, isBottom]);
};

export type { FretDescriptor };
