import React from "react";
import GuitarString from "./GuitarString";
import type { RenderedString } from "./hooks/useRenderedStrings";
import type { ScaleName } from "@/constants";
import { scales } from "@/constants";
import type { SoundType } from "@/audio";

type GuitarNeckProps = {
  descriptors: RenderedString[];
  frets: number;
  scale: ScaleName;
  keyy: string;
  scaleHighlightBottomOnly: boolean;
  reduceAnimations: boolean;
  trailLength: number;
  minimalHighlight: boolean;
  soundType?: SoundType;
  onPlayNote?: (absSemitone: number, durationMs?: number) => void;
};

const GuitarNeck: React.FC<GuitarNeckProps> = React.memo(({
  descriptors,
  frets,
  scale,
  keyy,
  scaleHighlightBottomOnly,
  reduceAnimations,
  trailLength,
  minimalHighlight,
  soundType,
  onPlayNote,
}) => {
  return (
    <div className="flex flex-col gap-2">
      {descriptors.map((descriptor) => (
        <GuitarString
          key={descriptor.originalIndex}
          idx={descriptor.renderIndex}
          frets={frets}
          note={descriptor.baseNote}
          scale={scale}
          scales={scales}
          keyy={keyy}
          scaleHighlightBottomOnly={scaleHighlightBottomOnly}
          isBottom={descriptor.isBottom}
          reduceAnimations={reduceAnimations}
          trailLength={trailLength}
          minimalHighlight={minimalHighlight}
          soundType={soundType}
          onPlayNote={onPlayNote}
        />
      ))}
    </div>
  );
});

export default GuitarNeck;
