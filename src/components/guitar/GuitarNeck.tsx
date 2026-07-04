import React, { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import GuitarString from "./GuitarString";
import type { RenderedString } from "./hooks/useRenderedStrings";
import { useScalePositions } from "./hooks/useScalePositions";
import { useFormStore } from "@/store";
import type { PlayNoteFn } from "@/hooks/usePlayback";

type GuitarNeckProps = {
  descriptors: RenderedString[];
  frets: number;
  onPlayNote?: PlayNoteFn;
};

// Stable identity for strings with no notes in the active box
const EMPTY_FRETS: Set<number> = new Set();

const GuitarNeck: React.FC<GuitarNeckProps> = React.memo(({ descriptors, frets, onPlayNote }) => {
  const {
    scale, keyy, oncePerTone, minimalHighlight,
    soundType, selectedChordDegree,
  } = useFormStore(useShallow((state) => ({
    scale: state.scale,
    keyy: state.tone,
    oncePerTone: state.oncePerTone,
    minimalHighlight: state.minimalHighlight,
    soundType: state.soundType,
    selectedChordDegree: state.selectedChordDegree,
  })));

  const { activePosition } = useScalePositions();

  // Frets of the active box, grouped per low-based string index
  const positionFretsByString = useMemo(() => {
    if (!activePosition) return null;
    const byString = new Map<number, Set<number>>();
    for (const note of activePosition.notes) {
      let frets = byString.get(note.stringIndex);
      if (!frets) { frets = new Set(); byString.set(note.stringIndex, frets); }
      frets.add(note.fret);
    }
    return byString;
  }, [activePosition]);

  // String gauge: the lowest string renders as the thickest wire
  const wireHeightFor = (lowIndex: number): number => {
    const count = descriptors.length;
    const t = count > 1 ? lowIndex / (count - 1) : 1; // 0 = lowest string
    return Math.round((3.5 - t * 2.25) * 4) / 4;
  };

  return (
    <div className="flex flex-col">
      {descriptors.map((descriptor) => (
        <GuitarString
          key={descriptor.originalIndex}
          idx={descriptor.renderIndex}
          stringIndex={descriptor.lowIndex}
          positionFrets={
            positionFretsByString
              ? positionFretsByString.get(descriptor.lowIndex) ?? EMPTY_FRETS
              : null
          }
          frets={frets}
          note={descriptor.baseNote}
          scale={scale}
          keyy={keyy}
          scaleHighlightBottomOnly={oncePerTone}
          isBottom={descriptor.isBottom}
          minimalHighlight={minimalHighlight}
          soundType={soundType}
          selectedChordDegree={selectedChordDegree}
          wireHeight={wireHeightFor(descriptor.lowIndex)}
          onPlayNote={onPlayNote}
        />
      ))}
    </div>
  );
});

export default GuitarNeck;
