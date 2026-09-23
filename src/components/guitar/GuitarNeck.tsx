import React, { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import GuitarString from "./GuitarString";
import type { RenderedString } from "./hooks/useRenderedStrings";
import { useScalePositions } from "./hooks/useScalePositions";
import { neckColumns, inlayAt } from "./geometry";
import { useFormStore } from "@/store";
import type { PlayNoteFn } from "@/hooks/usePlayback";

type GuitarNeckProps = {
  descriptors: RenderedString[];
  frets: number;
  onPlayNote?: PlayNoteFn;
};

// Stable identity for strings with no notes in the active box
const EMPTY_FRETS: Set<number> = new Set();

// Wood, nut, fret wires and inlays: everything behind the strings. Inlays sit
// between strings (halfway, and at the thirds for the doubles) so notes don't cover them.
const Board: React.FC<{ frets: number; columns: string }> = React.memo(({ frets, columns }) => (
  <div className="neck-board" style={{ gridTemplateColumns: columns }} aria-hidden>
    <div className="neck-wood" />
    <div className="neck-nut" />
    {Array.from({ length: frets }, (_, i) => {
      const fret = i + 1;
      const inlay = inlayAt(fret);
      return (
        <div key={fret} className="neck-fret" style={{ gridColumn: fret + 1 }}>
          {inlay === 1 && <span className="neck-inlay" style={{ top: "50%" }} />}
          {inlay === 2 && (
            <>
              <span className="neck-inlay" style={{ top: "33.3%" }} />
              <span className="neck-inlay" style={{ top: "66.7%" }} />
            </>
          )}
        </div>
      );
    })}
  </div>
));

const GuitarNeck: React.FC<GuitarNeckProps> = React.memo(({ descriptors, frets, onPlayNote }) => {
  const {
    scale, keyy, highlightEnabled, singleStringScale, reduceAnimations, labelMode,
    soundType, selectedChordDegree,
  } = useFormStore(useShallow((state) => ({
    scale: state.scale,
    keyy: state.tone,
    highlightEnabled: state.highlightEnabled,
    singleStringScale: state.singleStringScale,
    reduceAnimations: state.reduceAnimations,
    labelMode: state.labelMode,
    soundType: state.soundType,
    selectedChordDegree: state.selectedChordDegree,
  })));

  const { activePosition } = useScalePositions();
  const columns = useMemo(() => neckColumns(frets), [frets]);

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
    <div className={reduceAnimations ? "neck reduce-motion" : "neck"}>
      <Board frets={frets} columns={columns} />
      {descriptors.map((descriptor) => (
        <GuitarString
          key={descriptor.originalIndex}
          stringIndex={descriptor.lowIndex}
          stringCount={descriptors.length}
          positionFrets={
            positionFretsByString
              ? positionFretsByString.get(descriptor.lowIndex) ?? EMPTY_FRETS
              : null
          }
          frets={frets}
          columns={columns}
          note={descriptor.baseNote}
          scale={scale}
          keyy={keyy}
          highlightEnabled={highlightEnabled}
          scaleHighlightBottomOnly={singleStringScale}
          isBottom={descriptor.isBottom}
          labelMode={labelMode}
          soundType={soundType}
          selectedChordDegree={selectedChordDegree}
          onPlayNote={onPlayNote}
        />
      ))}
    </div>
  );
});

export default GuitarNeck;
