import React, { useMemo, useRef } from 'react';
import { keyToOffset, getScalePitchClasses, getNote } from '@/music';
import { ScaleName, PhraseMode, scales } from '@/constants';
import { Play } from 'lucide-react';
import { getCurrentTime, SoundType } from '@/audio';
import { scheduler } from '@/scheduler';
import { buildRelSequence } from '@/phrases';
import { toneAnimationManager } from '@/lib/tone-animation';

type Props = {
  scale: ScaleName;
  scales: typeof scales;
  keyy: string;
  playingAbs?: number | null;
  highlightEnabled?: boolean;
  mode: PhraseMode;
  stepMs: number;
  swing: boolean;
  octaves?: number;
  scheduleHorizon?: number;
  onPlayNote?: (absSemitone: number, durationMs?: number) => void;
  stopAllPlayback?: () => void;
  soundType?: SoundType;
  reduceAnimations?: boolean;
  minimalHighlight?: boolean;
  trailLength?: number;
};

const ScaleLegend: React.FC<Props & { descend?: boolean; loop?: boolean }> = ({ scale, scales, keyy, playingAbs, highlightEnabled = true, mode, stepMs, swing, octaves = 2, scheduleHorizon = 800, onPlayNote, stopAllPlayback, soundType = 'marimba', reduceAnimations = false, minimalHighlight = false, trailLength = 1200, descend = false, loop = false }) => {
  const keyOffset = keyToOffset(keyy);
  const pcs = getScalePitchClasses(scales[scale]);

  const relSequence = useMemo<number[]>(() => buildRelSequence(pcs, mode, octaves, descend), [mode, pcs, octaves, descend]);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const schedulerSessionRef = React.useRef<number | null>(null);
  const playSessionRef = React.useRef<number>(0);
  
  const clearPlayTimers = () => {
    if (schedulerSessionRef.current != null) {
      scheduler.stopSession(schedulerSessionRef.current);
      schedulerSessionRef.current = null;
    }
  };

  // Pre-compute the entire sequence for optimized playback
  const preComputedEvents = useMemo(() => {
    if (relSequence.length === 0) return [];

    const straightMs = Math.max(20, stepMs);
    const longF = 4 / 3; // 2:1 swing
    const shortF = 2 / 3;

    const events: Array<{ abs: number; startTimeSec: number; durSec: number }> = [];
    let currentTime = 0;

    // Generate first sequence
    relSequence.forEach((rel, idx) => {
      const factor = swing ? (idx % 2 === 0 ? longF : shortF) : 1;
      const durSec = (straightMs * factor) / 1000;
      
      events.push({
        abs: keyOffset + rel,
        startTimeSec: currentTime,
        durSec: Math.max(0.2, durSec + 0.04)
      });
      
      currentTime += durSec;
    });

    return events;
  }, [relSequence, stepMs, swing, keyOffset]);

  const playArpeggio = () => {
    // Cancel previous playback immediately
    clearPlayTimers();
    stopAllPlayback?.();
    const session = playSessionRef.current + 1;
    playSessionRef.current = session;
    setIsPlaying(true);

    if (preComputedEvents.length === 0) {
      setIsPlaying(false);
      return;
    }

    // Create events with absolute timing
    const startTime = getCurrentTime() + 0.03; // small audio lookahead
    let allEvents = preComputedEvents.map(event => ({
      ...event,
      startTimeSec: startTime + event.startTimeSec
    }));

    // Handle looping by extending the event sequence
    if (loop) {
      const loopDuration = preComputedEvents[preComputedEvents.length - 1].startTimeSec + 
                          preComputedEvents[preComputedEvents.length - 1].durSec;
      
      // Generate enough loops to cover a reasonable time (e.g., 60 seconds)
      const maxLoops = Math.ceil(60 / loopDuration);
      
      for (let i = 1; i < maxLoops; i++) {
        const loopEvents = preComputedEvents.map(event => ({
          ...event,
          startTimeSec: startTime + event.startTimeSec + (i * loopDuration)
        }));
        allEvents.push(...loopEvents);
      }
    }

    // Start optimized session
    const sid = scheduler.startOptimizedSession(
      allEvents,
      (abs, durMs) => {
        if (playSessionRef.current !== session) return; // cancelled
        onPlayNote?.(abs, durMs);
      },
      soundType,
      trailLength,
      reduceAnimations || minimalHighlight
    );
    
    schedulerSessionRef.current = sid;

    // Auto-stop for non-looping sequences
    if (!loop) {
      const totalDuration = allEvents[allEvents.length - 1].startTimeSec - startTime + 
                           allEvents[allEvents.length - 1].durSec;
      setTimeout(() => {
        if (playSessionRef.current === session) {
          setIsPlaying(false);
          clearPlayTimers();
        }
      }, totalDuration * 1000 + 100); // Small buffer
    }
  };

  const onTogglePlay = () => {
    if (isPlaying) {
      clearPlayTimers();
      stopAllPlayback?.();
      setIsPlaying(false);
    } else {
      playArpeggio();
    }
  };

  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {pcs.map((pc, i) => {
          const abs = keyOffset + pc;
          const note = getNote(abs);
          const isTonic = i === 0;
          const isActive = highlightEnabled && typeof playingAbs === 'number' && ((playingAbs % 12) + 12) % 12 === ((abs % 12) + 12) % 12;
          return (
            <div
              key={pc}
              ref={(el) => {
                if (el) {
                  toneAnimationManager.applyToneClass(el, abs);
                }
              }}
              data-pc={pc}
              className={
                'relative overflow-hidden px-2 py-1 rounded-md text-sm uppercase tracking-wide transition-colors border ' +
                (isActive
                  ? 'bg-cyan-600/20 text-cyan-100 border-cyan-400'
                  : isTonic
                    ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/70'
                    : 'bg-amber-500/15 text-amber-200 border-amber-400/50')
              }
            >
              <span className="font-semibold mr-1">{i + 1}</span>
              {note}
              
              {/* Tone-based animation overlay */}
              <span className="tone-overlay" />
              
              {/* Legacy fallback overlay */}
              {isActive && !reduceAnimations && !minimalHighlight && (
                <span className="note-fade-overlay note-fade-strong" style={{ animationDuration: `${trailLength}ms` }} />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onTogglePlay}
          className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-wide text-zinc-100 hover:bg-white/10 hover:border-white/25 transition-colors"
          title={isPlaying ? 'Pause phrase' : 'Play phrase'}
        >
          <Play className="h-4 w-4" /> {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>
    </div>
  );
};

export default ScaleLegend;
