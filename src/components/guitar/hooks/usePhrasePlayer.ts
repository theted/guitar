import { useCallback, useEffect, useRef, useState } from "react";
import { scheduler } from "@/scheduler";
import { getCurrentTime, SoundType, stopAllAudio } from "@/audio";
import { AUDIO_LOOKAHEAD_SEC } from "@/constants";
import type { PhraseEvent } from "./usePhraseEvents";

type UsePhrasePlayerArgs = {
  events: PhraseEvent[];
  loopDuration: number;
  loop: boolean;
  onPlayNote?: (absSemitone: number, durationMs?: number) => void;
  soundType?: SoundType;
  stopAllPlayback?: () => void;
  stopSignal?: number;
};

export const usePhrasePlayer = ({
  events,
  loopDuration,
  loop,
  onPlayNote,
  soundType = "marimba",
  stopAllPlayback,
  stopSignal,
}: UsePhrasePlayerArgs) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const schedulerSessionRef = useRef<number | null>(null);
  const playSessionRef = useRef<number>(0);
  const ignoredStopSignalRef = useRef<Set<number>>(new Set());
  const lastStopSignalRef = useRef<number | undefined>(stopSignal);

  const clearPlayTimers = useCallback(() => {
    playSessionRef.current += 1;
    if (schedulerSessionRef.current != null) {
      scheduler.stopSession(schedulerSessionRef.current);
      schedulerSessionRef.current = null;
    }
    stopAllAudio();
  }, []);

  const triggerGlobalStop = useCallback(() => {
    if (!stopAllPlayback) return;
    const predictedNext = typeof stopSignal === "number" ? stopSignal + 1 : 0;
    ignoredStopSignalRef.current.add(predictedNext);
    stopAllPlayback();
  }, [stopAllPlayback, stopSignal]);

  const playArpeggio = useCallback(() => {
    clearPlayTimers();
    triggerGlobalStop();

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
      (abs, durationMs) => {
        if (playSessionRef.current !== session) return;
        onPlayNote?.(abs, durationMs);
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
        setIsPlaying(false);
        clearPlayTimers();
      }, totalDuration * 1000 + 100);
    }
  }, [
    clearPlayTimers,
    triggerGlobalStop,
    events,
    loop,
    loopDuration,
    onPlayNote,
    soundType,
  ]);

  const onTogglePlay = useCallback(() => {
    if (isPlaying) {
      clearPlayTimers();
      triggerGlobalStop();
      setIsPlaying(false);
    } else {
      playArpeggio();
    }
  }, [isPlaying, clearPlayTimers, triggerGlobalStop, playArpeggio]);

  useEffect(() => {
    if (stopSignal == null) return;
    if (lastStopSignalRef.current === stopSignal) return;
    lastStopSignalRef.current = stopSignal;

    if (ignoredStopSignalRef.current.has(stopSignal)) {
      ignoredStopSignalRef.current.delete(stopSignal);
      return;
    }

    ignoredStopSignalRef.current.clear();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsPlaying(false);
    clearPlayTimers();
  }, [stopSignal, clearPlayTimers]);

  return { isPlaying, onTogglePlay };
};
