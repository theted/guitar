import React from "react";
import ScaleLegend from "./ScaleLegend";
import ChordStrip from "./ChordStrip";
import PositionStrip from "./PositionStrip";
import PhraseStrip from "./PhraseStrip";
import GuitarNeck from "./GuitarNeck";
import FretMarkers from "@/components/guitar/FretMarkers";
import { useRenderedStrings } from "@/components/guitar/hooks/useRenderedStrings";
import { useFretboard } from "@/components/guitar/hooks/useFretboard";
import { useFormStore } from "@/store";
import type { PlayNoteFn } from "@/hooks/usePlayback";
import type { PhraseEvent } from "@/components/guitar/hooks/usePhraseEvents";

type Props = {
  onPlayNote?: PlayNoteFn;
  /** The phrase the play button will run, for the step-by-step strip */
  phraseEvents: PhraseEvent[];
};

const Guitar: React.FC<Props> = ({ onPlayNote, phraseEvents }) => {
  const lowAtBottom = useFormStore((state) => state.lowAtBottom);
  const { baseNotes, frets } = useFretboard();

  const { descriptors, fretMarkers } = useRenderedStrings({ baseNotes, frets, lowAtBottom });

  return (
    <div className="w-[92vw] max-w-[1600px] guitar-container">
      <ScaleLegend />
      <ChordStrip />
      <PositionStrip />
      <PhraseStrip events={phraseEvents} />
      {/* Frets keep a minimum width; the neck scrolls horizontally when they don't fit */}
      <div className="overflow-x-auto pb-1">
        <GuitarNeck descriptors={descriptors} frets={frets} onPlayNote={onPlayNote} />
        <FretMarkers markers={fretMarkers} />
      </div>
    </div>
  );
};

export default Guitar;
