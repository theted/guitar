import React from "react";
import GuitarString from "./GuitarString";
import ScaleLegend from "./ScaleLegend";
import { keyToOffset } from "@/music";
import { scales, tunings } from "@/constants";
import { useFormStore } from "@/store";

type Props = {
  playingAbs?: number | null;
  playingSet?: number[];
  onPlayNote?: (absSemitone: number, durationMs?: number) => void;
  stopAllPlayback?: () => void;
};

const Guitar: React.FC<Props> = ({ playingAbs, playingSet, onPlayNote, stopAllPlayback }) => {
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
    scheduleHorizon,
    soundType,
  } = useFormStore((s) => s);

  const stepMs = 60000 / Math.max(1, bpm);
  const enableHighlight = highlightEnabled && !legendOnly;
  const stringsObj = Array.from({ length: strings }, (_, i) => i);
  const fretsObj = Array.from({ length: frets + 1 }, (_, i) => i);
  const orderedStrings = lowAtBottom ? stringsObj : stringsObj.slice().reverse();
  const bottomRenderIdx = orderedStrings.length - 1;

  // Build absolute base semitone for each tuning string
  const tuningArr = tunings[tuningName];
  const tuningPCs = tuningArr.map((t: string) => keyToOffset(t));
  const absBaseByTuningIndex: number[] = new Array(tuningPCs.length);
  if (tuningPCs.length > 0) {
    const last = tuningPCs.length - 1;
    const pcHigh = tuningPCs[last];
    const anchorEAbs = 12 * (startOctave - 4); // 0 => E4
    absBaseByTuningIndex[last] = anchorEAbs + pcHigh;
    for (let s = last - 1; s >= 0; s -= 1) {
      const pc = tuningPCs[s];
      const above = absBaseByTuningIndex[s + 1];
      let cand = pc;
      while (cand >= above) cand -= 12;
      while (cand + 12 < above) cand += 12;
      absBaseByTuningIndex[s] = cand;
    }
  }

  // Determine which rendered string should highlight for current playingAbs
  let playingRenderedIndex: number | null = null;
  if (typeof playingAbs === 'number') {
    const renderedBases = orderedStrings.map((i) => {
      const tIdx = tuningArr.length - 1 - (i % tuningArr.length);
      const cycle = Math.floor(i / tuningArr.length);
      return absBaseByTuningIndex[tIdx] - cycle * 12;
    });
    for (let j = renderedBases.length - 1; j >= 0; j -= 1) {
      const base = renderedBases[j];
      const neededFret = playingAbs - base;
      if (neededFret >= 0 && neededFret <= frets) { playingRenderedIndex = j; break; }
    }
  }

  return (
    <div className="w-[92vw] max-w-[1600px] guitar-container">
      <ScaleLegend
        scale={scale}
        scales={scales}
        keyy={keyy}
        playingAbs={playingAbs}
        highlightEnabled={enableHighlight}
        mode={phraseMode}
        stepMs={stepMs}
        swing={swing}
        octaves={phraseOctaves}
        scheduleHorizon={scheduleHorizon}
        onPlayNote={onPlayNote}
        stopAllPlayback={stopAllPlayback}
        soundType={soundType}
        reduceAnimations={reduceAnimations}
        minimalHighlight={minimalHighlight}
        trailLength={trailLength}
        descend={phraseDescend}
        loop={phraseLoop}
      />
      <div className="flex flex-col gap-2">
        {orderedStrings.map((i, renderIdx) => {
          const tuningIndex = tuningArr.length - 1 - (i % tuningArr.length);
          const cycle = Math.floor(i / tuningArr.length);
          const baseAbs = absBaseByTuningIndex[tuningIndex] - cycle * 12;
          return (
            <GuitarString
              key={i}
              idx={renderIdx}
              frets={frets}
              note={baseAbs}
              scale={scale}
              scales={scales}
              keyy={keyy}
              scaleHighlightBottomOnly={oncePerTone}
              isBottom={renderIdx === bottomRenderIdx}
              highlightEnabled={enableHighlight}
              octaveHighlight={octaveHighlight && !minimalHighlight}
              reduceAnimations={reduceAnimations}
              trailLength={trailLength}
              minimalHighlight={minimalHighlight}
              soundType={soundType}
              playingAbs={playingAbs}
              playingSet={playingSet}
              playingIndex={playingRenderedIndex}
              onPlayNote={onPlayNote}
            />
          );
        })}
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(48px,1fr))] gap-1 mt-3 text-sm opacity-60 select-none">
        {fretsObj.map((f) => (<div key={f} className="text-center">{f}</div>))}
      </div>
    </div>
  );
};

export default Guitar;
