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
    scale, keyy, oncePerTone, reduceAnimations, minimalHighlight,
    soundType, selectedChordDegree,
  } = useFormStore(useShallow((state) => ({
    scale: state.scale,
    keyy: state.tone,
    oncePerTone: state.oncePerTone,
    reduceAnimations: state.reduceAnimations,
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

  return (
    <div className="flex flex-col gap-2">
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
          reduceAnimations={reduceAnimations}
          minimalHighlight={minimalHighlight}
          soundType={soundType}
          selectedChordDegree={selectedChordDegree}
          onPlayNote={onPlayNote}
        />
      ))}
    </div>
  );
});

export default GuitarNeck;
