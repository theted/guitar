import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { getScalePositions, type ScalePosition } from "@/theory/positions";
import { getScalePitchClasses, keyToOffset } from "@/music";
import { scales, type KeyName, type ScaleName } from "@/constants";
import { useFormStore } from "@/store";
import { useFretboard } from "./useFretboard";

type PositionArgs = {
  baseNotes: number[];
  frets: number;
  tone: KeyName;
  scale: ScaleName;
  span: number;
};

export const computePositions = ({ baseNotes, frets, tone, scale, span }: PositionArgs): ScalePosition[] =>
  getScalePositions({
    stringBaseNotes: baseNotes,
    frets,
    keyOffset: keyToOffset(tone),
    scalePcs: getScalePitchClasses(scales[scale]),
    span,
  });

/**
 * The position starting at `lowFret`, as a 1-based index — or, if a different
 * span merged it into a neighbour, the one covering that fret. Position
 * numbers can shift between spans; where the hand sits is what to keep.
 */
export const positionAtFret = (positions: ScalePosition[], lowFret: number): number | null => {
  const exact = positions.find((position) => position.lowFret === lowFret);
  if (exact) return exact.index;
  const covering = positions.find((position) => position.lowFret <= lowFret && lowFret <= position.highFret);
  return covering?.index ?? null;
};

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
    () => computePositions({ baseNotes, frets, tone, scale, span: positionSpan }),
    [baseNotes, frets, scale, tone, positionSpan]
  );

  // Selection is guarded here so stale persisted indices simply mean "off"
  const activePosition =
    selectedPosition != null ? positions[selectedPosition - 1] ?? null : null;

  return { positions, activePosition };
};
