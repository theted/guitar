import { useCallback, useEffect, useRef, useState } from "react";
import { scheduler } from "@/scheduler";
import { getCurrentTime, SoundType, stopAllAudio, stopVoicesStartingAfter } from "@/audio";
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

/** A phrase as it is being played: its events and where they sit on the audio clock */
export type PhraseRun = {
  events: PhraseEvent[];
  /** AudioContext time of the phrase's time zero in its first pass */
  base: number;
  /** Seconds per pass when looping, null for a single pass */
  loopDuration: number | null;
};

/**
 * The next step of a running phrase that hasn't started by `now`, and when it
 * is due. Null when a single pass has no steps left.
 */
export const nextStep = (run: PhraseRun, now: number): { index: number; at: number } | null => {
  const { events, base, loopDuration } = run;
  if (events.length === 0) return null;
  const elapsed = now - base;
  const cycle = loopDuration && elapsed > 0 ? Math.floor(elapsed / loopDuration) : 0;
  const cycleStart = base + cycle * (loopDuration ?? 0);
  const index = events.findIndex((event) => cycleStart + event.startTimeSec > now);
  if (index >= 0) return { index, at: cycleStart + events[index].startTimeSec };
  if (!loopDuration) return null;
  return { index: 0, at: cycleStart + loopDuration + events[0].startTimeSec };
};

/**
 * Plays the phrase. Changing it while it plays (a new key, tempo, pattern,
 * sound…) carries on from the same step on the next beat rather than
 * stopping. `stop` is the one way playback ends early: it is stable, safe to
 * call while idle, and always leaves `isPlaying` false.
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
  const isPlayingRef = useRef(false);
  const schedulerSessionRef = useRef<number | null>(null);
  const runRef = useRef<PhraseRun | null>(null);
  const endTimerRef = useRef<number | null>(null);
  // Bumped on every start and stop; callbacks from an older run see a stale
  // value and do nothing
  const playSessionRef = useRef<number>(0);

  const setPlaying = useCallback((playing: boolean) => {
    isPlayingRef.current = playing;
    setIsPlaying(playing);
  }, []);

  // End the current run's scheduling; what's already sounding is the caller's call
  const endRun = useCallback(() => {
    playSessionRef.current += 1;
    if (schedulerSessionRef.current != null) {
      scheduler.stopSession(schedulerSessionRef.current);
      schedulerSessionRef.current = null;
    }
    if (endTimerRef.current != null) {
      window.clearTimeout(endTimerRef.current);
      endTimerRef.current = null;
    }
    runRef.current = null;
  }, []);

  const stop = useCallback(() => {
    endRun();
    stopAllAudio();
    setPlaying(false);
  }, [endRun, setPlaying]);

  // Start the phrase at step `fromIndex`, sounding at `at` (AudioContext time)
  const startRun = useCallback((fromIndex: number, at: number) => {
    endRun();
    if (events.length === 0) {
      stopAllAudio();
      setPlaying(false);
      return;
    }

    const session = playSessionRef.current + 1;
    playSessionRef.current = session;
    const base = at - events[fromIndex].startTimeSec;
    runRef.current = { events, base, loopDuration: loop ? loopDuration : null };

    // Looping repeats this single pass natively in the scheduler — no event
    // pre-generation, and it runs until stopped instead of for a fixed window.
    schedulerSessionRef.current = scheduler.startPhraseSession(
      events.map((event) => ({ ...event, startTimeSec: base + event.startTimeSec })),
      (abs, durationMs, event) => {
        if (playSessionRef.current !== session) return;
        onPlayNote?.(abs, durationMs, event);
      },
      soundType,
      loop ? loopDuration : undefined,
      fromIndex,
    );

    if (!loop) {
      const last = events[events.length - 1];
      const endsInMs = (base + last.startTimeSec + last.durSec - getCurrentTime()) * 1000;
      endTimerRef.current = window.setTimeout(() => {
        if (playSessionRef.current !== session) return;
        stop();
      }, endsInMs + 100);
    }
  }, [endRun, events, loop, loopDuration, onPlayNote, soundType, setPlaying, stop]);

  // A change while playing: pick up from the next step, on its beat
  useEffect(() => {
    if (!isPlayingRef.current || !runRef.current) return;
    const now = getCurrentTime();
    const next = nextStep(runRef.current, now);
    // A single pass on its last note just finishes
    if (!next) return;
    // Notes already scheduled for later belong to the old phrase
    stopVoicesStartingAfter(now);
    const index = next.index < events.length ? next.index : 0;
    // Only sets state when the new phrase is empty and playback has to end
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startRun(index, Math.max(next.at, now + 0.01));
    // startRun changes exactly when the phrase or its sound does
  }, [startRun, events.length]);

  const onTogglePlay = useCallback(() => {
    if (isPlaying) {
      stop();
      silenceOthers?.();
      return;
    }
    stopAllAudio();
    silenceOthers?.();
    startRun(0, getCurrentTime() + AUDIO_LOOKAHEAD_SEC);
    if (events.length > 0) setPlaying(true);
  }, [isPlaying, stop, silenceOthers, startRun, events.length, setPlaying]);

  return { isPlaying, onTogglePlay, stop };
};
