import { useMemo } from "react";
import { getScalePitchClasses, keyToOffset } from "@/music";
import { relativeTo } from "@/theory/pitch";
import { getSpellingMap, formatNoteWithOctave, getDegreeNames } from "@/theory/spelling";
import type { SelectedChord } from "./useSelectedChord";
import { scales } from "@/constants";
import type { ScaleName } from "@/constants";

type ScaleMap = typeof scales;

type UseStringNotesArgs = {
  note: number;
  frets: number;
  scale: ScaleName;
  keyy: string;
  scaleMap?: ScaleMap;
  /** Master switch for marking scale notes at all */
  highlightEnabled: boolean;
  /** Mark the scale on the lowest string only */
  lowestStringOnly: boolean;
  /** This is the lowest-pitched string (whichever row it's drawn in) */
  isLowest: boolean;
  /** The chord being practised (see useSelectedChord), or null */
  chord?: SelectedChord | null;
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
  /** How the scale reads this note: "1", "♭3", "♯4"… null outside the scale */
  degreeName: string | null;
  /** null when no chord is selected; otherwise membership in the chord */
  chordTone: boolean | null;
  isChordRoot: boolean;
  /** The note named from the chord's root (R, ♭3, 9 …); null with no chord or outside the scale */
  chordLabel: string | null;
  /** null when no position is selected; otherwise membership in the box */
  inPosition: boolean | null;
};

export const useStringNotes = ({
  note,
  frets,
  scale,
  keyy,
  scaleMap = scales,
  highlightEnabled,
  lowestStringOnly,
  isLowest,
  chord = null,
  positionFrets = null,
}: UseStringNotesArgs): FretDescriptor[] => {
  return useMemo(() => {
    const descriptors: FretDescriptor[] = [];
    const pitchClasses = getScalePitchClasses(scaleMap[scale]);
    const keyOffset = keyToOffset(keyy);
    const spellingMap = getSpellingMap(keyy, pitchClasses);
    const names = getDegreeNames(keyy, pitchClasses);

    const chordPcs = chord ? new Set<number>(chord.tones) : null;

    for (let fret = 0; fret <= frets; fret += 1) {
      const actualNote = note + fret;
      const relativePc = relativeTo(actualNote, keyOffset);
      const isSelected = pitchClasses.includes(relativePc);
      const isBase = relativePc === 0;
      const showScaleHighlight =
        highlightEnabled && isSelected && (!lowestStringOnly || isLowest);
      const degree = isSelected ? pitchClasses.indexOf(relativePc) + 1 : null;
      const degreeName = degree != null ? names[degree - 1] : null;
      const label = formatNoteWithOctave(actualNote, spellingMap);
      const chordTone = chordPcs ? chordPcs.has(relativePc) : null;
      const isChordRoot = chord != null && relativePc === chord.root;
      const chordLabel = chord?.labels.get(relativePc) ?? null;
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
        degreeName,
        chordTone,
        isChordRoot,
        chordLabel,
        inPosition,
      });
    }

    return descriptors;
  }, [note, frets, scale, keyy, scaleMap, highlightEnabled, lowestStringOnly, isLowest, chord, positionFrets]);
};

export type { FretDescriptor };
