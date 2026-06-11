import { useCallback, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useFormStore } from "@/store";
import { keyToOffset, getScalePitchClasses } from "@/music";
import { getDiatonicChords } from "@/theory/chords";
import { scales } from "@/constants";
import { scheduler } from "@/scheduler";
import { stopAllAudio, ensureAudioInitialized } from "@/audio";
import { toneAnimationManager } from "@/lib/tone-animation";
import { usePhraseEvents } from "@/components/guitar/hooks/usePhraseEvents";
import { usePhrasePlayer } from "@/components/guitar/hooks/usePhrasePlayer";

export type PlayNoteFn = (
  absSemitone: number,
  durationMs?: number,
  source?: "fretboard" | "phrase"
) => void;

// Owns all playback orchestration: phrase event generation, the phrase
// player session, fretboard note flashes and the global stop signal.
export const usePlayback = () => {
  const {
    scale, tone, phraseMode, bpm, swing, phraseOctaves, phraseDescend,
    phraseLoop, soundType, trailLength, minimalHighlight, reduceAnimations,
    selectedChordDegree,
  } = useFormStore(useShallow((state) => ({
    scale: state.scale,
    tone: state.tone,
    phraseMode: state.phraseMode,
    bpm: state.bpm,
    swing: state.swing,
    phraseOctaves: state.phraseOctaves,
    phraseDescend: state.phraseDescend,
    phraseLoop: state.phraseLoop,
    soundType: state.soundType,
    trailLength: state.trailLength,
    minimalHighlight: state.minimalHighlight,
    reduceAnimations: state.reduceAnimations,
    selectedChordDegree: state.selectedChordDegree,
  })));

  const playingTimersRef = useRef<Record<number, number>>({});
  const [stopSignal, setStopSignal] = useState(0);

  const stopAllPlayback = useCallback(() => {
    scheduler.stopAll();
    stopAllAudio();
    Object.values(playingTimersRef.current).forEach((tid) => {
      try { window.clearTimeout(tid); } catch { /* already cleared */ }
    });
    playingTimersRef.current = {};
    toneAnimationManager.stopAll();
    setStopSignal((cur) => cur + 1);
  }, []);

  const playNote: PlayNoteFn = useCallback((absSemitone, durationMs = 200) => {
    // Long visual trails are an animation; honor both opt-outs
    const flashMs = minimalHighlight || reduceAnimations
      ? durationMs
      : Math.max(trailLength, durationMs);
    const existing = playingTimersRef.current[absSemitone];
    if (existing) window.clearTimeout(existing);
    toneAnimationManager.flashTone(absSemitone, flashMs, "octave-specific");
    const tid = window.setTimeout(() => {
      delete playingTimersRef.current[absSemitone];
    }, flashMs);
    playingTimersRef.current[absSemitone] = tid as unknown as number;
  }, [trailLength, minimalHighlight, reduceAnimations]);

  const keyOffset = useMemo(() => keyToOffset(tone), [tone]);
  const pitchClasses = useMemo(() => getScalePitchClasses(scales[scale]), [scale]);
  const stepMs = Math.round(60000 / Math.max(1, bpm));

  // Chord arpeggio mode plays the selected diatonic chord's tones (the tonic
  // chord when none is selected) through the regular phrase machinery.
  const phrasePitchClasses = useMemo(() => {
    if (phraseMode !== "chord-arp") return pitchClasses;
    const chords = getDiatonicChords(tone, pitchClasses);
    const chord = (selectedChordDegree != null ? chords[selectedChordDegree - 1] : null) ?? chords[0];
    if (!chord) return pitchClasses;
    return [...chord.pcs].sort((a, b) => a - b);
  }, [phraseMode, tone, pitchClasses, selectedChordDegree]);

  const { events, loopDuration } = usePhraseEvents({
    pitchClasses: phrasePitchClasses,
    mode: phraseMode,
    octaves: phraseOctaves,
    descend: phraseDescend,
    stepMs,
    swing,
    keyOffset,
  });

  const phrasePlayNote = useCallback(
    (abs: number, durationMs?: number) => playNote(abs, durationMs, "phrase"),
    [playNote]
  );

  const { isPlaying, onTogglePlay } = usePhrasePlayer({
    events,
    loopDuration,
    loop: phraseLoop,
    onPlayNote: phrasePlayNote,
    soundType,
    stopAllPlayback,
    stopSignal,
  });

  const togglePlay = useCallback(async () => {
    if (!isPlaying) {
      try {
        await ensureAudioInitialized();
      } catch (error) {
        console.error("Failed to initialize audio:", error);
        return;
      }
    }
    onTogglePlay();
  }, [isPlaying, onTogglePlay]);

  return { isPlaying, togglePlay, stopAllPlayback, playNote, stopSignal };
};
