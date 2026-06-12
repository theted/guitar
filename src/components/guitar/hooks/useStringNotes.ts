import { useMemo } from "react";
import { getScalePitchClasses, keyToOffset } from "@/music";
import { getSpellingMap, formatNoteWithOctave } from "@/theory/spelling";
import { getDiatonicChords } from "@/theory/chords";
import { scales } from "@/constants";
import { pitchClass as asPitchClass } from "@/types";
import type { ScaleName } from "@/constants";

type ScaleMap = typeof scales;

type UseStringNotesArgs = {
  note: number;
  frets: number;
  scale: ScaleName;
  keyy: string;
  scaleMap?: ScaleMap;
  scaleHighlightBottomOnly: boolean;
  isBottom: boolean;
  /** 1-based diatonic chord degree to emphasize, or null */
  selectedChordDegree?: number | null;
  /** Frets of the active practice position on this string, null when off */
  positionFrets?: Set<number> | null;
};

type FretDescriptor = {
  fret: number;
  actualNote: number;
  label: string;
  /** Pitch class relative to the key tonic */
  relativePc: number;
  isSelected: boolean;
  isBase: boolean;
  showScaleHighlight: boolean;
  degree: number | null;
  /** null when no chord is selected; otherwise membership in the chord */
  chordTone: boolean | null;
  isChordRoot: boolean;
  /** null when no position is selected; otherwise membership in the box */
  inPosition: boolean | null;
};

export const useStringNotes = ({
  note,
  frets,
  scale,
  keyy,
  scaleMap = scales,
  scaleHighlightBottomOnly,
  isBottom,
  selectedChordDegree = null,
  positionFrets = null,
}: UseStringNotesArgs): FretDescriptor[] => {
  return useMemo(() => {
    const descriptors: FretDescriptor[] = [];
    const pitchClasses = getScalePitchClasses(scaleMap[scale]);
    const keyOffset = keyToOffset(keyy);
    const spellingMap = getSpellingMap(keyy, pitchClasses);

    const chords = selectedChordDegree != null ? getDiatonicChords(keyy, pitchClasses) : [];
    const chord = selectedChordDegree != null ? chords[selectedChordDegree - 1] ?? null : null;
    const chordPcs = chord ? new Set<number>(chord.pcs) : null;

    for (let fret = 0; fret <= frets; fret += 1) {
      const actualNote = note + fret;
      const relativePc = asPitchClass((((actualNote - keyOffset) % 12) + 12) % 12);
      const isSelected = pitchClasses.includes(relativePc);
      const isBase = relativePc === 0;
      const showScaleHighlight = isSelected && (!scaleHighlightBottomOnly || isBottom);
      const degree = isSelected ? pitchClasses.indexOf(relativePc) + 1 : null;
      const label = formatNoteWithOctave(actualNote, spellingMap);
      const chordTone = chordPcs ? chordPcs.has(relativePc) : null;
      const isChordRoot = chord != null && relativePc === chord.pcs[0];
      const inPosition = positionFrets ? positionFrets.has(fret) : null;

      descriptors.push({
        fret,
        actualNote,
        label,
        relativePc,
        isSelected,
        isBase,
        showScaleHighlight,
        degree,
        chordTone,
        isChordRoot,
        inPosition,
      });
    }

    return descriptors;
  }, [note, frets, scale, keyy, scaleMap, scaleHighlightBottomOnly, isBottom, selectedChordDegree, positionFrets]);
};

export type { FretDescriptor };
