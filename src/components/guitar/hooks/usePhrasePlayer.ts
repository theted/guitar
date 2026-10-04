import { useCallback, useEffect, useRef, useState } from "react";
import { scheduler } from "@/scheduler";
import { getCurrentTime, SoundType, stopAllAudio, stopVoicesStartingAfter } from "@/audio";
import { AUDIO_LOOKAHEAD_SEC } from "@/constants";
import type { PlayNoteFn } from "@/hooks/usePlayback";
import type { PhraseEvent } from "./usePhraseEvents";

type UsePhrasePlayerArgs = {
  events: PhraseEvent[];
  /** Seconds per pass: from the first step to the beat after the last */
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
  /** Seconds per pass: from the first step to the beat after the last */
  passDuration: number;
  loop: boolean;
};

/**
 * The next step of a running phrase that hasn't started by `now`, and when it
 * is due. Null when a single pass has no steps left.
 */
export const nextStep = (run: PhraseRun, now: number): { index: number; at: number } | null => {
  const { events, base } = run;
  if (events.length === 0) return null;
  const period = run.loop && run.passDuration > 0 ? run.passDuration : 0;
  const elapsed = now - base;
  const cycle = period && elapsed > 0 ? Math.floor(elapsed / period) : 0;
  const cycleStart = base + cycle * period;
  const index = events.findIndex((event) => cycleStart + event.startTimeSec > now);
  if (index >= 0) return { index, at: cycleStart + events[index].startTimeSec };
  if (!period) return null;
  return { index: 0, at: cycleStart + period + events[0].startTimeSec };
};

/**
 * Where playback carries on when the phrase changes to `events` while `run`
 * plays: the next step that hasn't sounded, when it was due. A single pass
 * that has already sounded every step carries on only if the new phrase goes
 * further — it got longer, or it loops now — on the beat after its last step.
 * Null when the change leaves nothing more to play.
 */
export const resumePoint = (
  run: PhraseRun,
  now: number,
  events: PhraseEvent[],
  loop: boolean,
): { index: number; at: number } | null => {
  const next = nextStep(run, now);
  if (next) return { index: next.index < events.length ? next.index : 0, at: next.at };

  const at = run.base + run.passDuration;
  const played = run.events.length;
  if (played < events.length) return { index: played, at };
  if (!loop || events.length === 0) return null;
  // A pass that ended on the note the loop starts with (a run back down to
  // the tonic) has just played the loop's first step: go on from the second
  const endedOnFirst = events.length > 1 && run.events[played - 1].abs === events[0].abs;
  return { index: endedOnFirst ? 1 : 0, at };
};

/**
 * Plays the phrase. Changing it while it plays (a new key, tempo, pattern,
 * sound…) carries on from the same step on the next beat rather than
 * stopping. A single pass that plays to its end lets its last notes ring out.
 * `stop` is the one way playback ends early and silences what's sounding: it
 * is stable, safe to call while idle, and always leaves `isPlaying` false.
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
    runRef.current = { events, base, passDuration: loopDuration, loop };

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
        // Played to the end: the last notes ring out rather than being cut
        endRun();
        setPlaying(false);
      }, endsInMs + 100);
    }
  }, [endRun, events, loop, loopDuration, onPlayNote, soundType, setPlaying]);

  // A change while playing: pick up from the next step, on its beat
  useEffect(() => {
    if (!isPlayingRef.current || !runRef.current) return;
    const now = getCurrentTime();
    const resume = resumePoint(runRef.current, now, events, loop);
    // A single pass on its last note just finishes, unless the change takes
    // it further. An empty phrase still goes through startRun, which stops.
    if (!resume && events.length > 0) return;
    // Notes already scheduled for later belong to the old phrase
    stopVoicesStartingAfter(now);
    // Only sets state when the new phrase is empty and playback has to end
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startRun(resume?.index ?? 0, Math.max(resume?.at ?? now, now + 0.01));
    // startRun changes exactly when the phrase, its loop or its sound does
  }, [startRun, events, loop]);

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
