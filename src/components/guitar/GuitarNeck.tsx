import React from "react";
import { useShallow } from "zustand/react/shallow";
import GuitarString from "./GuitarString";
import type { RenderedString } from "./hooks/useRenderedStrings";
import { useFormStore } from "@/store";
import type { PlayNoteFn } from "@/hooks/usePlayback";

type GuitarNeckProps = {
  descriptors: RenderedString[];
  frets: number;
  onPlayNote?: PlayNoteFn;
};

const GuitarNeck: React.FC<GuitarNeckProps> = React.memo(({ descriptors, frets, onPlayNote }) => {
  const {
    scale, keyy, oncePerTone, reduceAnimations, trailLength, minimalHighlight,
    soundType, selectedChordDegree,
  } = useFormStore(useShallow((state) => ({
    scale: state.scale,
    keyy: state.tone,
    oncePerTone: state.oncePerTone,
    reduceAnimations: state.reduceAnimations,
    trailLength: state.trailLength,
    minimalHighlight: state.minimalHighlight,
    soundType: state.soundType,
    selectedChordDegree: state.selectedChordDegree,
  })));

  return (
    <div className="flex flex-col gap-2">
      {descriptors.map((descriptor) => (
        <GuitarString
          key={descriptor.originalIndex}
          idx={descriptor.renderIndex}
          frets={frets}
          note={descriptor.baseNote}
          scale={scale}
          keyy={keyy}
          scaleHighlightBottomOnly={oncePerTone}
          isBottom={descriptor.isBottom}
          reduceAnimations={reduceAnimations}
          trailLength={trailLength}
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
