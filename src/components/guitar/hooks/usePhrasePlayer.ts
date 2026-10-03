import { useCallback, useRef, useState } from "react";
import { scheduler } from "@/scheduler";
import { getCurrentTime, SoundType, stopAllAudio } from "@/audio";
import { AUDIO_LOOKAHEAD_SEC } from "@/constants";
import type { PlayNoteFn } from "@/hooks/usePlayback";
import type { PhraseEvent } from "./usePhraseEvents";

type UsePhrasePlayerArgs = {
  events: PhraseEvent[];
  loopDuration: number;
  loop: boolean;
  onPlayNote?: PlayNoteFn;
  soundType?: SoundType;
  /** Silences everything else (fret clicks, flashes) before a phrase starts */
  silenceOthers?: () => void;
};

/**
 * Plays the phrase. `stop` is the one way playback ends early: it is stable,
 * safe to call while idle, and always leaves `isPlaying` false.
 */
export const usePhrasePlayer = ({
  events,
  loopDuration,
  loop,
  onPlayNote,
  soundType = "marimba",
  silenceOthers,
}: UsePhrasePlayerArgs) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const schedulerSessionRef = useRef<number | null>(null);
  // Bumped on every start and stop; callbacks from an older run see a stale
  // value and do nothing
  const playSessionRef = useRef<number>(0);

  const clearPlayTimers = useCallback(() => {
    playSessionRef.current += 1;
    if (schedulerSessionRef.current != null) {
      scheduler.stopSession(schedulerSessionRef.current);
      schedulerSessionRef.current = null;
    }
    stopAllAudio();
  }, []);

  const stop = useCallback(() => {
    clearPlayTimers();
    setIsPlaying(false);
  }, [clearPlayTimers]);

  const playArpeggio = useCallback(() => {
    clearPlayTimers();
    silenceOthers?.();

    if (events.length === 0) {
      setIsPlaying(false);
      return;
    }

    const session = playSessionRef.current + 1;
    playSessionRef.current = session;
    setIsPlaying(true);

    const startTime = getCurrentTime() + AUDIO_LOOKAHEAD_SEC;
    const absoluteEvents = events.map((event) => ({
      ...event,
      startTimeSec: startTime + event.startTimeSec,
    }));

    // Looping repeats this single pass natively in the scheduler — no event
    // pre-generation, and it runs until stopped instead of for a fixed window.
    const sessionId = scheduler.startPhraseSession(
      absoluteEvents,
      (abs, durationMs, event) => {
        if (playSessionRef.current !== session) return;
        onPlayNote?.(abs, durationMs, event);
      },
      soundType,
      loop ? loopDuration : undefined,
    );

    schedulerSessionRef.current = sessionId;

    if (!loop) {
      const last = absoluteEvents[absoluteEvents.length - 1];
      const totalDuration = last ? last.startTimeSec - startTime + last.durSec : 0;

      window.setTimeout(() => {
        if (playSessionRef.current !== session) return;
        stop();
      }, totalDuration * 1000 + 100);
    }
  }, [clearPlayTimers, silenceOthers, events, loop, loopDuration, onPlayNote, soundType, stop]);

  const onTogglePlay = useCallback(() => {
    if (isPlaying) {
      stop();
      silenceOthers?.();
    } else {
      playArpeggio();
    }
  }, [isPlaying, stop, silenceOthers, playArpeggio]);

  return { isPlaying, onTogglePlay, stop };
};
