import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { getScalePositions, getStringBaseNotes, type ScalePosition } from "@/theory/positions";
import { getScalePitchClasses, keyToOffset } from "@/music";
import { scales, tunings } from "@/constants";
import { useFormStore } from "@/store";

// Shared, memoized position computation for the strip, the fretboard dimming
// and the playback path. Returns the position list plus the active selection.
export const useScalePositions = (): {
  positions: ScalePosition[];
  activePosition: ScalePosition | null;
} => {
  const { tuningName, strings, frets, startOctave, scale, tone, positionSpan, selectedPosition } =
    useFormStore(useShallow((state) => ({
      tuningName: state.tuningName,
      strings: state.strings,
      frets: state.frets,
      startOctave: state.startOctave,
      scale: state.scale,
      tone: state.tone,
      positionSpan: state.positionSpan,
      selectedPosition: state.selectedPosition,
    })));

  const positions = useMemo(
    () =>
      getScalePositions({
        stringBaseNotes: getStringBaseNotes(tunings[tuningName], strings, startOctave),
        frets,
        keyOffset: keyToOffset(tone),
        scalePcs: getScalePitchClasses(scales[scale]),
        span: positionSpan,
      }),
    [tuningName, strings, frets, startOctave, scale, tone, positionSpan]
  );

  // Selection is guarded here so stale persisted indices simply mean "off"
  const activePosition =
    selectedPosition != null ? positions[selectedPosition - 1] ?? null : null;

  return { positions, activePosition };
};
