import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { getScalePositions, type ScalePosition } from "@/theory/positions";
import { getScalePitchClasses, keyToOffset } from "@/music";
import { scales } from "@/constants";
import { useFormStore } from "@/store";
import { useFretboard } from "./useFretboard";

// Shared, memoized position computation for the strip, the fretboard dimming
// and the playback path. Returns the position list plus the active selection.
export const useScalePositions = (): {
  positions: ScalePosition[];
  activePosition: ScalePosition | null;
} => {
  const { scale, tone, positionSpan, selectedPosition } = useFormStore(
    useShallow((state) => ({
      scale: state.scale,
      tone: state.tone,
      positionSpan: state.positionSpan,
      selectedPosition: state.selectedPosition,
    }))
  );
  const { baseNotes, frets } = useFretboard();

  const positions = useMemo(
    () =>
      getScalePositions({
        stringBaseNotes: baseNotes,
        frets,
        keyOffset: keyToOffset(tone),
        scalePcs: getScalePitchClasses(scales[scale]),
        span: positionSpan,
      }),
    [baseNotes, frets, scale, tone, positionSpan]
  );

  // Selection is guarded here so stale persisted indices simply mean "off"
  const activePosition =
    selectedPosition != null ? positions[selectedPosition - 1] ?? null : null;

  return { positions, activePosition };
};
