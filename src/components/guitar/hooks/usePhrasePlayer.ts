import { useCallback, useEffect, useRef, useState } from "react";
import { scheduler } from "@/scheduler";
import { getCurrentTime, SoundType, stopAllAudio } from "@/audio";
import type { PhraseEvent } from "./usePhraseEvents";

type UsePhrasePlayerArgs = {
  events: PhraseEvent[];
  loopDuration: number;
  loop: boolean;
  onPlayNote?: (absSemitone: number, durationMs?: number) => void;
  soundType?: SoundType;
  trailLength?: number;
  reduceAnimations?: boolean;
  minimalHighlight?: boolean;
  stopAllPlayback?: () => void;
  stopSignal?: number;
};

export const usePhrasePlayer = ({
  events,
  loopDuration,
  loop,
  onPlayNote,
  soundType = "marimba",
  trailLength = 1200,
  reduceAnimations = false,
  minimalHighlight = false,
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

    const startTime = getCurrentTime() + 0.03;
    let allEvents = events.map((event) => ({
      ...event,
      startTimeSec: startTime + event.startTimeSec,
    }));

    if (loop && loopDuration > 0) {
      const maxLoops = Math.ceil(60 / loopDuration);
      for (let i = 1; i < maxLoops; i += 1) {
        const loopEvents = events.map((event) => ({
          ...event,
          startTimeSec: startTime + event.startTimeSec + i * loopDuration,
        }));
        allEvents = allEvents.concat(loopEvents);
      }
    }

    const sessionId = scheduler.startOptimizedSession(
      allEvents,
      (abs, durationMs) => {
        if (playSessionRef.current !== session) return;
        onPlayNote?.(abs, durationMs);
      },
      soundType,
      trailLength,
      reduceAnimations || minimalHighlight
    );

    schedulerSessionRef.current = sessionId;

    if (!loop) {
      const totalDuration =
        allEvents.length > 0
          ? allEvents[allEvents.length - 1].startTimeSec - startTime + allEvents[allEvents.length - 1].durSec
          : 0;

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
    trailLength,
    reduceAnimations,
    minimalHighlight,
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
    setIsPlaying(false);
    clearPlayTimers();
  }, [stopSignal, clearPlayTimers]);

  return { isPlaying, onTogglePlay };
};
