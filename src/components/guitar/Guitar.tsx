import React from "react";
import { useShallow } from "zustand/react/shallow";
import ChordStrip from "./ChordStrip";
import PositionStrip from "./PositionStrip";
import PhraseStrip from "./PhraseStrip";
import GuitarNeck from "./GuitarNeck";
import FretMarkers from "./FretMarkers";
import { neckMinWidth } from "./geometry";
import { Segmented } from "@/components/ui/segmented";
import { useRenderedStrings } from "@/components/guitar/hooks/useRenderedStrings";
import { useFretboard } from "@/components/guitar/hooks/useFretboard";
import { useScalePositions } from "@/components/guitar/hooks/useScalePositions";
import { setFormState, useFormStore, type LabelMode } from "@/store";
import type { PlayNoteFn } from "@/hooks/usePlayback";
import type { PhraseEvent } from "@/components/guitar/hooks/usePhraseEvents";

type Props = {
  onPlayNote?: PlayNoteFn;
  /** The phrase the play button will run, for the step-by-step strip */
  phraseEvents: PhraseEvent[];
};

const LABEL_OPTIONS: ReadonlyArray<{ value: LabelMode; label: string; title: string }> = [
  { value: "note", label: "Notes", title: "Name each note (E, F♯, G…)" },
  { value: "degree", label: "Degrees", title: "Number each note by its place in the scale (1–7)" },
  { value: "interval", label: "Intervals", title: "Show each note's interval from the root (P1, m3, P5…)" },
];

// How the scale is shown on the neck, the neck itself, and the phrase that
// Play will run through it.
const Guitar: React.FC<Props> = ({ onPlayNote, phraseEvents }) => {
  const { lowAtBottom, labelMode, leftHanded } = useFormStore(useShallow((state) => ({
    lowAtBottom: state.lowAtBottom,
    labelMode: state.labelMode,
    leftHanded: state.leftHanded,
  })));
  const { baseNotes, frets } = useFretboard();

  const { descriptors } = useRenderedStrings({ baseNotes, lowAtBottom });

  // Picking a position brings it into view when the neck is scrolled sideways
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const { activePosition } = useScalePositions();
  const lowFret = activePosition?.lowFret;
  React.useEffect(() => {
    const scroller = scrollRef.current;
    if (lowFret == null || !scroller || scroller.scrollWidth <= scroller.clientWidth) return;
    const fret = scroller.querySelector<HTMLElement>(`.neck-string > .fret:nth-child(${lowFret + 1})`);
    if (!fret) return;
    // Measured on screen so it works whichever way the neck faces
    const box = scroller.getBoundingClientRect();
    const target = fret.getBoundingClientRect();
    const left = leftHanded ? target.right - box.right + 48 : target.left - box.left - 48;
    scroller.scrollBy({ left, behavior: "smooth" });
  }, [lowFret, leftHanded]);

  return (
    <section className="flex flex-col gap-4" aria-label="Fretboard">
      {/* On phones the neck comes first; these options follow it */}
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 max-sm:order-last">
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          <ChordStrip />
          <PositionStrip />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-ink-3">Label notes with</span>
          <Segmented
            aria-label="Label notes with"
            value={labelMode}
            onChange={(value) => setFormState({ labelMode: value })}
            options={LABEL_OPTIONS}
          />
        </div>
      </div>

      {/* Frets keep a minimum width; the neck scrolls sideways when they don't fit */}
      <div ref={scrollRef} dir={leftHanded ? "rtl" : undefined} className="neck-scroll -mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
        <div style={{ minWidth: neckMinWidth(frets) }}>
          <GuitarNeck descriptors={descriptors} frets={frets} onPlayNote={onPlayNote} />
          <FretMarkers frets={frets} />
        </div>
      </div>

      <PhraseStrip events={phraseEvents} />
    </section>
  );
};

export default Guitar;
