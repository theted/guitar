import { useMemo } from "react";
import type { PhraseMode } from "@/constants";
import { buildRelSequence } from "@/phrases";
import type { PositionNote } from "@/theory/positions";
import type { PitchClass } from "@/types";

export type PhraseEvent = {
  abs: number;
  startTimeSec: number;
  durSec: number;
  /** Set when the event targets one specific fretboard location */
  stringIndex?: number;
  fret?: number;
};

interface UsePhraseEventsArgs {
  pitchClasses: number[];
  mode: PhraseMode;
  octaves: number;
  descend: boolean;
  stepMs: number;
  swing: boolean;
  keyOffset: number;
  /**
   * Concrete fretboard path (position practice). When set, the phrase mode /
   * octave expansion is bypassed: the path plays ascending, plus its mirror
   * when `descend` is on, and every event carries its fret location.
   */
  path?: PositionNote[] | null;
}

type SequenceNote = { abs: number; stringIndex?: number; fret?: number };

export const usePhraseEvents = ({
  pitchClasses,
  mode,
  octaves,
  descend,
  stepMs,
  swing,
  keyOffset,
  path = null,
}: UsePhraseEventsArgs) => {
  const relSequence = useMemo(
    () => (path ? [] : buildRelSequence(pitchClasses as PitchClass[], mode, octaves, descend)),
    [path, pitchClasses, mode, octaves, descend]
  );

  const sequence = useMemo<SequenceNote[]>(() => {
    if (path) {
      const ascending = path.map((note) => ({
        abs: note.abs,
        stringIndex: note.stringIndex,
        fret: note.fret,
      }));
      if (!descend || ascending.length < 2) return ascending;
      return [...ascending, ...ascending.slice(0, -1).reverse()];
    }
    return relSequence.map((relative) => ({ abs: keyOffset + relative }));
  }, [path, descend, relSequence, keyOffset]);

  const { events, loopDuration } = useMemo(() => {
    if (sequence.length === 0) {
      return { events: [] as PhraseEvent[], loopDuration: 0 };
    }

    const straightMs = Math.max(20, Math.round(stepMs));
    const longF = 4 / 3;
    const shortF = 2 / 3;

    const generated: PhraseEvent[] = [];
    let currentTime = 0;

    sequence.forEach((note, index) => {
      const factor = swing ? (index % 2 === 0 ? longF : shortF) : 1;
      const durationSeconds = (straightMs * factor) / 1000;

      generated.push({
        abs: note.abs,
        startTimeSec: currentTime,
        durSec: Math.max(0.2, durationSeconds + 0.04),
        ...(note.stringIndex !== undefined && { stringIndex: note.stringIndex, fret: note.fret }),
      });

      currentTime += durationSeconds;
    });

    const totalDuration =
      generated.length > 0
        ? generated[generated.length - 1].startTimeSec + generated[generated.length - 1].durSec
        : 0;

    return { events: generated, loopDuration: totalDuration };
  }, [sequence, stepMs, swing]);

  return { relSequence, events, loopDuration };
};
