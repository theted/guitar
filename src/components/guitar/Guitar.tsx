import React from "react";
import ScaleLegend from "./ScaleLegend";
import GuitarNeck from "./GuitarNeck";
import FretMarkers from "@/components/guitar/FretMarkers";
import { useRenderedStrings } from "@/components/guitar/useRenderedStrings";
import { useFormStore } from "@/store";

type Props = {
  playingAbs?: number | null;
  playingSet?: number[];
  onPlayNote?: (absSemitone: number, durationMs?: number) => void;
  stopAllPlayback?: () => void;
  stopSignal?: number;
};

const Guitar: React.FC<Props> = ({ playingAbs, playingSet, onPlayNote, stopAllPlayback, stopSignal }) => {
  const {
    strings,
    frets,
    scale,
    tuningName,
    tone: keyy,
    lowAtBottom,
    highlightEnabled,
    legendOnly,
    octaveHighlight,
    phraseMode,
    bpm,
    swing,
    phraseOctaves,
    startOctave,
    oncePerTone,
    phraseDescend,
    phraseLoop,
    reduceAnimations,
    trailLength,
    minimalHighlight,
    soundType,
  } = useFormStore((state) => ({
    strings: state.strings,
    frets: state.frets,
    scale: state.scale,
    tuningName: state.tuningName,
    tone: state.tone,
    lowAtBottom: state.lowAtBottom,
    highlightEnabled: state.highlightEnabled,
    legendOnly: state.legendOnly,
    octaveHighlight: state.octaveHighlight,
    phraseMode: state.phraseMode,
    bpm: state.bpm,
    swing: state.swing,
    phraseOctaves: state.phraseOctaves,
    startOctave: state.startOctave,
    oncePerTone: state.oncePerTone,
    phraseDescend: state.phraseDescend,
    phraseLoop: state.phraseLoop,
    reduceAnimations: state.reduceAnimations,
    trailLength: state.trailLength,
    minimalHighlight: state.minimalHighlight,
    soundType: state.soundType,
  }));

  const stepMs = 60000 / Math.max(1, bpm);
  const enableHighlight = highlightEnabled && !legendOnly;

  const { descriptors, fretMarkers } = useRenderedStrings({
    strings,
    frets,
    tuningName,
    startOctave,
    lowAtBottom,
  });

  return (
    <div className="w-[92vw] max-w-[1600px] guitar-container">
      <ScaleLegend
        scale={scale}
        keyy={keyy}
        playingAbs={playingAbs}
        highlightEnabled={enableHighlight}
        mode={phraseMode}
        stepMs={stepMs}
        swing={swing}
        octaves={phraseOctaves}
        onPlayNote={onPlayNote}
        stopAllPlayback={stopAllPlayback}
        stopSignal={stopSignal}
        soundType={soundType}
        reduceAnimations={reduceAnimations}
        minimalHighlight={minimalHighlight}
        trailLength={trailLength}
        descend={phraseDescend}
        loop={phraseLoop}
      />
      <GuitarNeck
        descriptors={descriptors}
        frets={frets}
        scale={scale}
        keyy={keyy}
        highlightEnabled={enableHighlight}
        scaleHighlightBottomOnly={oncePerTone}
        octaveHighlight={octaveHighlight && !minimalHighlight}
        reduceAnimations={reduceAnimations}
        trailLength={trailLength}
        minimalHighlight={minimalHighlight}
        soundType={soundType}
        playingAbs={playingAbs}
        playingSet={playingSet}
        onPlayNote={onPlayNote}
      />
      <FretMarkers markers={fretMarkers} />
    </div>
  );
};

export default Guitar;
