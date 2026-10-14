import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { getScalePitchClasses } from "@/music";
import { chordLabel, chordRelativeNames, chordTones, getDiatonicChords, type DiatonicChord } from "@/theory/chords";
import { scales, type KeyName, type ScaleName } from "@/constants";
import { useFormStore } from "@/store";
import type { PitchClass } from "@/types/music";

export type SelectedChord = {
  chord: DiatonicChord;
  /** Roman numeral and name as shown, triad or 7th: { roman: "ii7", name: "Dm7" } */
  roman: string;
  name: string;
  /** The chord's tones relative to the key tonic, root first */
  tones: PitchClass[];
  /** Relative pitch class of the chord's root */
  root: PitchClass;
  /** Each scale note named from the chord's root: R, ♭3, 5, ♭7, 9, 11, 13 … */
  labels: ReadonlyMap<number, string>;
};

/** The chord on `degree` (1-based) of the scale, or null when there's none */
export const selectChord = (
  tone: KeyName,
  scale: ScaleName,
  degree: number | null,
  sevenths: boolean
): SelectedChord | null => {
  if (degree == null) return null;
  const pcs = getScalePitchClasses(scales[scale]);
  const chord = getDiatonicChords(tone, pcs)[degree - 1];
  // A stale degree, or a scale without diatonic chords: nothing selected
  if (!chord) return null;
  const names = chordRelativeNames(pcs, degree - 1);
  return {
    chord,
    ...chordLabel(chord, sevenths),
    tones: chordTones(chord, sevenths),
    root: chord.pcs[0],
    labels: new Map(pcs.map((pc, index) => [pc as number, names[index]])),
  };
};

/**
 * The diatonic chord being practised, or null. One memoized object, so the
 * neck, legend, transport and playback all agree on it and memoized
 * components only re-render when it actually changes.
 */
export const useSelectedChord = (): SelectedChord | null => {
  const { scale, tone, degree, sevenths } = useFormStore(useShallow((state) => ({
    scale: state.scale,
    tone: state.tone,
    degree: state.selectedChordDegree,
    sevenths: state.chordSevenths,
  })));

  return useMemo(() => selectChord(tone, scale, degree, sevenths), [scale, tone, degree, sevenths]);
};
