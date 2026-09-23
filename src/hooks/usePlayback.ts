import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useFormStore } from "@/store";
import { keyToOffset, getScalePitchClasses } from "@/music";
import { getDiatonicChords, getChordArpOffsets } from "@/theory/chords";
import { getPhraseRootAbs, getPlayableOctaves } from "@/phrases";
import { scales } from "@/constants";
import type { PitchClass } from "@/types";
import { scheduler } from "@/scheduler";
import { stopAllAudio, ensureAudioInitialized } from "@/audio";
import { toneAnimationManager } from "@/lib/tone-animation";
import { usePhraseEvents, type PhraseEvent } from "@/components/guitar/hooks/usePhraseEvents";
import { usePhrasePlayer } from "@/components/guitar/hooks/usePhrasePlayer";
import { useScalePositions } from "@/components/guitar/hooks/useScalePositions";
import { useFretboard } from "@/components/guitar/hooks/useFretboard";
import type { FretLocation } from "@/theory/fingering";

export type PlayNoteFn = (
  absSemitone: number,
  durationMs?: number,
  /** Present for phrase playback */
  event?: PhraseEvent,
  /** The fret that was clicked, for fret clicks */
  at?: FretLocation
) => void;

// Owns all playback orchestration: phrase event generation, the phrase
// player session, fretboard note flashes and the global stop signal.
export const usePlayback = () => {
  const {
    scale, tone, phraseMode, bpm, swing, phraseOctaves, phraseDescend,
    phraseLoop, soundType, selectedChordDegree, flashMode,
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
    selectedChordDegree: state.selectedChordDegree,
    flashMode: state.flashMode,
  })));

  const playingTimersRef = useRef<Record<number, number>>({});
  const isPlayingRef = useRef(false);
  const [stopSignal, setStopSignal] = useState(0);

  const stopAllPlayback = useCallback(() => {
    scheduler.stopAll();
    stopAllAudio();
    const hadTimers = Object.keys(playingTimersRef.current).length > 0;
    Object.values(playingTimersRef.current).forEach((tid) => {
      try { window.clearTimeout(tid); } catch { /* already cleared */ }
    });
    playingTimersRef.current = {};
    toneAnimationManager.stopAll();
    // The signal exists to reset an active phrase session; bumping it while
    // idle would just re-render the whole tree for nothing.
    if (hadTimers || isPlayingRef.current) setStopSignal((cur) => cur + 1);
  }, []);

  // Flash settings are read at call time so this callback stays stable —
  // dragging the trail slider must not re-render the fretboard.
  const playNote: PlayNoteFn = useCallback((absSemitone, durationMs = 200, event, at) => {
    const { trailLength, reduceAnimations, flashMode: mode } = useFormStore.getState();
    // Long visual trails are an animation; honor the opt-out
    const flashMs = reduceAnimations
      ? durationMs
      : Math.max(trailLength, durationMs);
    const existing = playingTimersRef.current[absSemitone];
    if (existing) window.clearTimeout(existing);
    if (event?.stringIndex !== undefined && event.fret !== undefined) {
      // A fingered phrase or position practice: light up exactly the fret to play
      toneAnimationManager.flashAt(event.stringIndex, event.fret, flashMs);
    } else if (at && mode === "fret") {
      toneAnimationManager.flashAt(at.stringIndex, at.fret, flashMs);
    } else {
      toneAnimationManager.flashTone(absSemitone, flashMs);
    }
    // Phrase notes also advance the phrase strip
    if (event) toneAnimationManager.flashStep(event.index, flashMs);
    const tid = window.setTimeout(() => {
      delete playingTimersRef.current[absSemitone];
    }, flashMs);
    playingTimersRef.current[absSemitone] = tid as unknown as number;
  }, []);

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
    return getChordArpOffsets(chord);
  }, [phraseMode, tone, pitchClasses, selectedChordDegree]);

  // Phrases are laid out on the neck that is actually on screen: they start at
  // the lowest tonic available and span no further than the top fret.
  const { lowest, highest, baseNotes, frets } = useFretboard();
  // In "fret" mode the phrase is fingered, so each note lights one fret
  const neck = useMemo(
    () => (flashMode === "fret" ? { baseNotes, frets } : null),
    [flashMode, baseNotes, frets]
  );
  const rootAbs = useMemo(() => getPhraseRootAbs(keyOffset, lowest), [keyOffset, lowest]);
  const playableOctaves = useMemo(
    () =>
      getPlayableOctaves(
        phrasePitchClasses as PitchClass[],
        phraseMode,
        phraseOctaves,
        phraseDescend,
        rootAbs,
        highest
      ),
    [phrasePitchClasses, phraseMode, phraseOctaves, phraseDescend, rootAbs, highest]
  );

  // Position practice replaces the abstract phrase with the box's fret path
  const { activePosition } = useScalePositions();

  const { events, loopDuration } = usePhraseEvents({
    pitchClasses: phrasePitchClasses,
    mode: phraseMode,
    octaves: playableOctaves,
    descend: phraseDescend,
    stepMs,
    swing,
    rootAbs,
    path: activePosition?.notes ?? null,
    neck,
  });

  const { isPlaying, onTogglePlay } = usePhrasePlayer({
    events,
    loopDuration,
    loop: phraseLoop,
    onPlayNote: playNote,
    soundType,
    stopAllPlayback,
    stopSignal,
  });

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

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

  return { isPlaying, togglePlay, stopAllPlayback, playNote, stopSignal, events };
};
