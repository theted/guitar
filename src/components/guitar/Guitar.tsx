import React from "react";
import { useShallow } from "zustand/react/shallow";
import ScaleLegend from "./ScaleLegend";
import GuitarNeck from "./GuitarNeck";
import FretMarkers from "@/components/guitar/FretMarkers";
import { useRenderedStrings } from "@/components/guitar/hooks/useRenderedStrings";
import { useFormStore } from "@/store";
import type { PlayNoteFn } from "@/hooks/usePlayback";

type Props = {
  onPlayNote?: PlayNoteFn;
};

const Guitar: React.FC<Props> = ({ onPlayNote }) => {
  const { strings, frets, tuningName, startOctave, lowAtBottom } = useFormStore(
    useShallow((state) => ({
      strings: state.strings,
      frets: state.frets,
      tuningName: state.tuningName,
      startOctave: state.startOctave,
      lowAtBottom: state.lowAtBottom,
    }))
  );

  const { descriptors, fretMarkers } = useRenderedStrings({
    strings,
    frets,
    tuningName,
    startOctave,
    lowAtBottom,
  });

  return (
    <div className="w-[92vw] max-w-[1600px] guitar-container">
      <ScaleLegend />
      {/* Frets keep a minimum width; the neck scrolls horizontally when they don't fit */}
      <div className="overflow-x-auto pb-1">
        <GuitarNeck descriptors={descriptors} frets={frets} onPlayNote={onPlayNote} />
        <FretMarkers markers={fretMarkers} />
      </div>
    </div>
  );
};

export default Guitar;
