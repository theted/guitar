import { useMemo } from "react";
import type { PhraseMode } from "@/constants";
import { buildRelSequence } from "@/phrases";

export type PhraseEvent = {
  abs: number;
  startTimeSec: number;
  durSec: number;
};

interface UsePhraseEventsArgs {
  pitchClasses: number[];
  mode: PhraseMode;
  octaves: number;
  descend: boolean;
  stepMs: number;
  swing: boolean;
  keyOffset: number;
}

export const usePhraseEvents = ({
  pitchClasses,
  mode,
  octaves,
  descend,
  stepMs,
  swing,
  keyOffset,
}: UsePhraseEventsArgs) => {
  const relSequence = useMemo(
    () => buildRelSequence(pitchClasses, mode, octaves, descend),
    [pitchClasses, mode, octaves, descend]
  );

  const { events, loopDuration } = useMemo(() => {
    if (relSequence.length === 0) {
      return { events: [] as PhraseEvent[], loopDuration: 0 };
    }

    const straightMs = Math.max(20, stepMs);
    const longF = 4 / 3;
    const shortF = 2 / 3;

    const generated: PhraseEvent[] = [];
    let currentTime = 0;

    relSequence.forEach((relative, index) => {
      const factor = swing ? (index % 2 === 0 ? longF : shortF) : 1;
      const durationSeconds = (straightMs * factor) / 1000;

      generated.push({
        abs: keyOffset + relative,
        startTimeSec: currentTime,
        durSec: Math.max(0.2, durationSeconds + 0.04),
      });

      currentTime += durationSeconds;
    });

    const totalDuration =
      generated.length > 0
        ? generated[generated.length - 1].startTimeSec + generated[generated.length - 1].durSec
        : 0;

    return { events: generated, loopDuration: totalDuration };
  }, [relSequence, stepMs, swing, keyOffset]);

  return { relSequence, events, loopDuration };
};
