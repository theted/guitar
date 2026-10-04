import { useMemo } from "react";
import type { PhraseMode } from "@/constants";
import { buildRelSequence } from "@/phrases";
import type { PlaybackEvent } from "@/scheduler";
import type { PositionNote } from "@/theory/positions";
import { fingerSequence } from "@/theory/fingering";
import type { PitchClass } from "@/types";

/**
 * Phrase events are scheduler events with times relative to the start of the
 * phrase; usePhrasePlayer shifts them onto the AudioContext clock.
 */
export type PhraseEvent = PlaybackEvent;

interface UsePhraseEventsArgs {
  pitchClasses: number[];
  mode: PhraseMode;
  octaves: number;
  descend: boolean;
  stepMs: number;
  swing: boolean;
  /** Absolute semitone the phrase starts from (the tonic on the neck) */
  rootAbs: number;
  /**
   * Concrete fretboard path (position practice). When set, the phrase mode /
   * octave expansion is bypassed: the path plays ascending, plus its mirror
   * when `descend` is on, and every event carries its fret location.
   */
  path?: PositionNote[] | null;
  /**
   * The neck to finger the phrase on. When set, every event carries the fret
   * it's played on (see theory/fingering.ts), so playback lights that fret only.
   */
  neck?: { baseNotes: number[]; frets: number } | null;
  /**
   * The phrase will repeat. A phrase that ends on the note it starts with
   * (any descending run) drops that last note, so the turnaround doesn't
   * play the tonic twice.
   */
  loop?: boolean;
}

type SequenceNote = { abs: number; stringIndex?: number; fret?: number };

export const usePhraseEvents = ({
  pitchClasses,
  mode,
  octaves,
  descend,
  stepMs,
  swing,
  rootAbs,
  path = null,
  neck = null,
  loop = false,
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
    const notes = relSequence.map((relative) => rootAbs + relative);
    if (!neck) return notes.map((abs) => ({ abs }));
    const fingering = fingerSequence(notes, neck.baseNotes, neck.frets);
    return notes.map((abs, i) => ({ abs, ...fingering[i] }));
  }, [path, descend, relSequence, rootAbs, neck]);

  const { events, loopDuration } = useMemo(() => {
    const repeatsSeam =
      loop && sequence.length > 2 && sequence[0].abs === sequence[sequence.length - 1].abs;
    const played = repeatsSeam ? sequence.slice(0, -1) : sequence;

    if (played.length === 0) {
      return { events: [] as PhraseEvent[], loopDuration: 0 };
    }

    const straightMs = Math.max(20, Math.round(stepMs));
    const longF = 4 / 3;
    const shortF = 2 / 3;
    // Swing pairs a long step with a short one, a beat per pair. The last
    // note of an odd phrase has no partner, so it takes the whole beat: the
    // phrase stays a whole number of beats and every pass of a loop starts on
    // the beat, instead of two long steps at the seam pushing it off the grid.
    const swingFactor = (index: number) => {
      if (index % 2 === 1) return shortF;
      return index === played.length - 1 ? longF + shortF : longF;
    };

    const generated: PhraseEvent[] = [];
    let currentTime = 0;

    played.forEach((note, index) => {
      const factor = swing ? swingFactor(index) : 1;
      const durationSeconds = (straightMs * factor) / 1000;

      generated.push({
        abs: note.abs,
        startTimeSec: currentTime,
        durSec: Math.max(0.2, durationSeconds + 0.04),
        index,
        ...(note.stringIndex !== undefined && { stringIndex: note.stringIndex, fret: note.fret }),
      });

      currentTime += durationSeconds;
    });

    // One pass lasts until the next beat, not until the last note stops
    // ringing: notes sound a little past their step, and timing the loop to
    // the release put a gap at every turnaround
    return { events: generated, loopDuration: currentTime };
  }, [sequence, stepMs, swing, loop]);

  return { relSequence, events, loopDuration };
};
