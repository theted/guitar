import React from "react";
import GuitarString from "./GuitarString";
import type { RenderedString } from "./useRenderedStrings";
import type { ScaleName } from "@/constants";
import { scales } from "@/constants";
import type { SoundType } from "@/audio";

type GuitarNeckProps = {
  descriptors: RenderedString[];
  frets: number;
  scale: ScaleName;
  keyy: string;
  highlightEnabled: boolean;
  scaleHighlightBottomOnly: boolean;
  octaveHighlight: boolean;
  reduceAnimations: boolean;
  trailLength: number;
  minimalHighlight: boolean;
  soundType?: SoundType;
  playingAbs?: number | null;
  playingSet?: number[];
  onPlayNote?: (absSemitone: number, durationMs?: number) => void;
};

const GuitarNeck: React.FC<GuitarNeckProps> = ({
  descriptors,
  frets,
  scale,
  keyy,
  highlightEnabled,
  scaleHighlightBottomOnly,
  octaveHighlight,
  reduceAnimations,
  trailLength,
  minimalHighlight,
  soundType,
  playingAbs,
  playingSet,
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
          highlightEnabled={highlightEnabled}
          octaveHighlight={octaveHighlight}
          reduceAnimations={reduceAnimations}
          trailLength={trailLength}
          minimalHighlight={minimalHighlight}
          soundType={soundType}
          playingAbs={playingAbs}
          playingSet={playingSet}
          onPlayNote={onPlayNote}
        />
      ))}
    </div>
  );
};

export default GuitarNeck;
