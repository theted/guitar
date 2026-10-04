import React, { useMemo } from "react";
import { keyToOffset } from "@/music";
import { mod12 } from "@/theory/pitch";
import { nextCell, type NeckCell } from "./neckNavigation";
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
type BoardProps = {
  frets: number;
  columns: string;
  /** Fret range of the practised position, outlined on the board */
  box: { lowFret: number; highFret: number } | null;
};

const Board: React.FC<BoardProps> = React.memo(({ frets, columns, box }) => (
  <div className="neck-board" style={{ gridTemplateColumns: columns }} aria-hidden>
    <div className="neck-wood" />
    {box && (
      <div className="neck-box" style={{ gridColumn: `${box.lowFret + 1} / ${box.highFret + 2}` }} />
    )}
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

  // Keyboard: the neck is one tab stop. Until it's been used, the stop sits
  // on the tonic of the lowest string; afterwards wherever it was left.
  const [touched, setTouched] = React.useState<NeckCell | null>(null);
  const rowOrder = useMemo(() => descriptors.map((d) => d.lowIndex), [descriptors]);
  const cursor = useMemo<NeckCell>(() => {
    if (touched && touched.stringIndex < descriptors.length) {
      return { stringIndex: touched.stringIndex, fret: Math.min(touched.fret, frets) };
    }
    const lowest = descriptors.find((d) => d.lowIndex === 0);
    const rootFret = lowest ? mod12(keyToOffset(keyy) - lowest.baseNote) : 0;
    return { stringIndex: 0, fret: rootFret <= frets ? rootFret : 0 };
  }, [touched, descriptors, frets, keyy]);

  const cellAt = (container: HTMLElement, cell: NeckCell) =>
    container.querySelector<HTMLElement>(`[data-string="${cell.stringIndex}"][data-fret="${cell.fret}"]`);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const target = (event.target as HTMLElement).closest<HTMLElement>('[role="gridcell"]');
    if (!target) return;
    // Enter or Space plays the note under the cursor
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      target.click();
      return;
    }
    const here = { stringIndex: Number(target.dataset.string), fret: Number(target.dataset.fret) };
    const mirrored = getComputedStyle(event.currentTarget).direction === "rtl";
    const next = nextCell(here, event.key, { rowOrder, frets, mirrored });
    if (!next) return;
    event.preventDefault();
    setTouched(next);
    const cell = cellAt(event.currentTarget, next);
    cell?.focus();
    // Shift + arrow moves and plays: hear your way along the neck
    if (event.shiftKey) cell?.click();
  };

  // A fret focused any other way (a click, Tab) becomes the tab stop
  const onFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.getAttribute("role") !== "gridcell") return;
    const cell = { stringIndex: Number(target.dataset.string), fret: Number(target.dataset.fret) };
    if (cell.stringIndex !== cursor.stringIndex || cell.fret !== cursor.fret) setTouched(cell);
  };

  return (
    <div
      className={reduceAnimations ? "neck reduce-motion" : "neck"}
      role="grid"
      aria-label="Fretboard. Arrow keys move, Enter plays the note."
      onKeyDown={onKeyDown}
      onFocus={onFocus}
    >
      <Board
        frets={frets}
        columns={columns}
        box={activePosition && { lowFret: activePosition.lowFret, highFret: activePosition.highFret }}
      />
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
          lowestStringOnly={singleStringScale}
          isLowest={descriptor.lowIndex === 0}
          labelMode={labelMode}
          soundType={soundType}
          selectedChordDegree={selectedChordDegree}
          tabStopFret={cursor.stringIndex === descriptor.lowIndex ? cursor.fret : null}
          onPlayNote={onPlayNote}
        />
      ))}
    </div>
  );
});

export default GuitarNeck;
