import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { useFormStore } from "@/store";
import { keyToOffset, getScalePitchClasses } from "@/music";
import { getDiatonicChords, getChordArpOffsets, chordTones } from "@/theory/chords";
import { relativeTo } from "@/theory/pitch";
import { getPhraseRootAbs, getPlayableOctaves } from "@/phrases";
import { scales, STRUM_GAP_MS, STRUM_NOTE_MS } from "@/constants";
import type { PitchClass } from "@/types";
import { scheduler } from "@/scheduler";
import { stopAllAudio, ensureAudioInitialized } from "@/audio";
import { toneAnimationManager } from "@/lib/tone-animation";
import { usePhraseEvents, type PhraseEvent } from "@/components/guitar/hooks/usePhraseEvents";
import { usePhrasePlayer } from "@/components/guitar/hooks/usePhrasePlayer";
import { useScalePositions } from "@/components/guitar/hooks/useScalePositions";
import { useFretboard } from "@/components/guitar/hooks/useFretboard";
import { useSelectedChord } from "@/components/guitar/hooks/useSelectedChord";
import { phraseTurn } from "@/components/guitar/phraseCoverage";
import { fingerSequence, type FretLocation } from "@/theory/fingering";

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
    scale, tone, phraseMode, arpShape, bpm, swing, phraseOctaves, phraseDescend,
    phraseLoop, soundType, flashMode,
  } = useFormStore(useShallow((state) => ({
    scale: state.scale,
    tone: state.tone,
    phraseMode: state.phraseMode,
    arpShape: state.arpShape,
    bpm: state.bpm,
    swing: state.swing,
    phraseOctaves: state.phraseOctaves,
    phraseDescend: state.phraseDescend,
    phraseLoop: state.phraseLoop,
    soundType: state.soundType,
    flashMode: state.flashMode,
  })));

  const playingTimersRef = useRef<Record<number, number>>({});
  // The phrase being played, so a note can cue the one after it. A ref, read
  // at call time like the flash settings, so playNote keeps its identity.
  const phraseRef = useRef<{ events: PhraseEvent[]; loop: boolean; turn: number }>({ events: [], loop: false, turn: 0 });

  // Everything that sounds or glows outside the phrase session itself
  const silenceOthers = useCallback(() => {
    scheduler.stopAll();
    stopAllAudio();
    Object.values(playingTimersRef.current).forEach((tid) => {
      try { window.clearTimeout(tid); } catch { /* already cleared */ }
    });
    playingTimersRef.current = {};
    toneAnimationManager.stopAll();
  }, []);

  // Flash settings are read at call time so this callback stays stable —
  // dragging the trail slider must not re-render the fretboard.
  const playNote: PlayNoteFn = useCallback((absSemitone, durationMs = 200, event, at) => {
    const { trailLength, reduceAnimations, flashMode: mode, showNextNote } = useFormStore.getState();
    // Long visual trails are an animation; honor the opt-out
    const flashMs = reduceAnimations
      ? durationMs
      : Math.max(trailLength, durationMs);
    // A phrase note is the one being played until the next step starts; it
    // then dims, so at a fast tempo the current note stands out from the trail
    const holdMs = event?.stepSec !== undefined ? Math.round(event.stepSec * 1000) : durationMs;
    const existing = playingTimersRef.current[absSemitone];
    if (existing) window.clearTimeout(existing);
    if (event?.stringIndex !== undefined && event.fret !== undefined) {
      // A fingered phrase or position practice: light up exactly the fret to play
      toneAnimationManager.flashAt(event.stringIndex, event.fret, flashMs, holdMs);
    } else if (at && mode === "fret") {
      toneAnimationManager.flashAt(at.stringIndex, at.fret, flashMs, holdMs);
    } else {
      toneAnimationManager.flashTone(absSemitone, flashMs, holdMs);
    }
    // Phrase notes also advance the phrase strip
    if (event) toneAnimationManager.flashStep(event.index, flashMs, holdMs);
    // …and say which way through the phrase it is: from the turning note on,
    // the way down (unless the phrase never comes back)
    if (event) {
      const { events, turn } = phraseRef.current;
      toneAnimationManager.setDirection(event.index >= turn && turn < events.length - 1 ? 'down' : 'up');
    }
    // …and mark the note after them for the length of this step, until it plays
    if (event && showNextNote) {
      const { events, loop } = phraseRef.current;
      const next = events[event.index + 1] ?? (loop ? events[0] : undefined);
      if (next?.stringIndex !== undefined && next.fret !== undefined) {
        toneAnimationManager.cueAt(next.stringIndex, next.fret, holdMs);
      } else if (next) {
        toneAnimationManager.cueTone(next.abs, holdMs);
      }
      if (next) toneAnimationManager.cueStep(next.index, holdMs);
    }
    const tid = window.setTimeout(() => {
      delete playingTimersRef.current[absSemitone];
    }, flashMs);
    playingTimersRef.current[absSemitone] = tid as unknown as number;
  }, []);

  const keyOffset = useMemo(() => keyToOffset(tone), [tone]);
  const pitchClasses = useMemo(() => getScalePitchClasses(scales[scale]), [scale]);
  const stepMs = Math.round(60000 / Math.max(1, bpm));

  // A selected chord is what Play practises: its tones, arpeggiated in the
  // chosen shape, through the regular phrase machinery
  const chord = useSelectedChord();
  const phrasePitchClasses = useMemo(
    () => (chord ? getChordArpOffsets(chord.tones) : pitchClasses),
    [chord, pitchClasses]
  );
  const pattern = chord ? arpShape : phraseMode;

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
        pattern,
        phraseOctaves,
        phraseDescend,
        rootAbs,
        highest
      ),
    [phrasePitchClasses, pattern, phraseOctaves, phraseDescend, rootAbs, highest]
  );
  // The most this neck can hold, so the octave picker can say so
  const maxOctaves = useMemo(
    () => getPlayableOctaves(phrasePitchClasses as PitchClass[], pattern, 5, phraseDescend, rootAbs, highest),
    [phrasePitchClasses, pattern, phraseDescend, rootAbs, highest]
  );

  // Position practice replaces the abstract phrase with the box's fret path;
  // with a chord selected too, only the chord's tones in the box: its shape there
  const { activePosition } = useScalePositions();
  const path = useMemo(() => {
    if (!activePosition) return null;
    if (!chord) return activePosition.notes;
    return activePosition.notes.filter((note) => chord.tones.includes(relativeTo(note.abs, keyOffset)));
  }, [activePosition, chord, keyOffset]);

  const { events, loopDuration } = usePhraseEvents({
    pitchClasses: phrasePitchClasses,
    mode: pattern,
    octaves: playableOctaves,
    descend: phraseDescend,
    stepMs,
    swing,
    rootAbs,
    path,
    neck,
    loop: phraseLoop,
  });

  // A layout effect, so it's current before the player restarts on new events
  useLayoutEffect(() => {
    phraseRef.current = { events, loop: phraseLoop, turn: phraseTurn(events) };
  }, [events, phraseLoop]);

  const { isPlaying, onTogglePlay, stop } = usePhrasePlayer({
    events,
    loopDuration,
    loop: phraseLoop,
    onPlayNote: playNote,
    soundType,
    silenceOthers,
  });

  // Stopped, the neck shows both ways through the phrase
  useEffect(() => {
    if (!isPlaying) toneAnimationManager.setDirection(null);
  }, [isPlaying]);

  // The app-wide stop: ends the phrase (the button goes back to Play) and
  // silences everything else. Stable, and a no-op when nothing is playing.
  const stopAllPlayback = useCallback(() => {
    stop();
    silenceOthers();
  }, [stop, silenceOthers]);

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

  // Picking a chord sounds it: root to octave, low to high, fingered like a
  // phrase so the frets light up. Not while playing — a running arpeggio
  // already moves on to the new chord.
  const strumChord = useCallback(async (degree: number) => {
    if (isPlaying) return;
    const { chordSevenths, flashMode: mode, soundType: sound } = useFormStore.getState();
    const picked = getDiatonicChords(tone, pitchClasses)[degree - 1];
    if (!picked) return;
    const offsets = getChordArpOffsets(chordTones(picked, chordSevenths));
    const notes = [...offsets, offsets[0] + 12].map((offset) => rootAbs + offset);
    const fingering = mode === "fret" ? fingerSequence(notes, baseNotes, frets) : [];
    const locations = new Map(notes.map((abs, i) => [abs, fingering[i] ?? undefined]));
    try {
      await ensureAudioInitialized();
    } catch (error) {
      console.error("Failed to initialize audio:", error);
      return;
    }
    scheduler.strumNow(notes, STRUM_GAP_MS, STRUM_NOTE_MS, sound, (abs, durMs) =>
      playNote(abs, durMs, undefined, locations.get(abs))
    );
  }, [isPlaying, tone, pitchClasses, rootAbs, baseNotes, frets, playNote]);

  return { isPlaying, togglePlay, stopAllPlayback, playNote, strumChord, events, maxOctaves };
};
