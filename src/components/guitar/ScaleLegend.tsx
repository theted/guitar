import React, { useMemo, useCallback } from 'react';
import { keyToOffset, getScalePitchClasses, getNote } from '@/music';
import { ScaleName, PhraseMode, scales } from '@/constants';
import { Play } from 'lucide-react';
import { SoundType, ensureAudioInitialized } from '@/audio';
import { usePhraseEvents } from './hooks/usePhraseEvents';
import { usePhrasePlayer } from './hooks/usePhrasePlayer';
import ScaleDegree from './ScaleDegree';

interface ScaleLegendProps {
  scale: ScaleName;
  keyy: string;
  playingAbs?: number | null;
  highlightEnabled?: boolean;
  mode: PhraseMode;
  stepMs: number;
  swing: boolean;
  octaves?: number;
  scheduleHorizon?: number;
  onPlayNote?: (absSemitone: number, durationMs?: number, source?: 'fretboard' | 'phrase') => void;
  stopAllPlayback?: () => void;
  stopSignal?: number;
  soundType?: SoundType;
  reduceAnimations?: boolean;
  minimalHighlight?: boolean;
  trailLength?: number;
  descend?: boolean;
  loop?: boolean;
}

const ScaleLegend: React.FC<ScaleLegendProps> = ({
  scale,
  keyy,
  mode,
  stepMs,
  swing,
  octaves = 2,
  onPlayNote,
  stopAllPlayback,
  stopSignal,
  soundType = "marimba",
  reduceAnimations = false,
  minimalHighlight = false,
  trailLength = 1200,
  descend = false,
  loop = false,
}) => {
  const keyOffset = useMemo(() => keyToOffset(keyy), [keyy]);
  const pitchClasses = useMemo(() => getScalePitchClasses(scales[scale]), [scale]);

  const { events, loopDuration } = usePhraseEvents({
    pitchClasses,
    mode,
    octaves,
    descend,
    stepMs,
    swing,
    keyOffset,
  });

  const phrasePlayNote = useCallback(
    (abs: number, durationMs?: number) => onPlayNote?.(abs, durationMs, 'phrase'),
    [onPlayNote]
  );

  const { isPlaying, onTogglePlay: togglePlay } = usePhrasePlayer({
    events,
    loopDuration,
    loop,
    onPlayNote: phrasePlayNote,
    soundType,
    trailLength,
    reduceAnimations,
    minimalHighlight,
    stopAllPlayback,
    stopSignal,
  });

  const onTogglePlay = useCallback(async () => {
    if (!isPlaying) {
      try {
        await ensureAudioInitialized();
      } catch (error) {
        console.error('Failed to initialize audio:', error);
        return;
      }
    }
    togglePlay();
  }, [isPlaying, togglePlay]);

  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {pitchClasses.map((pc, index) => {
          const abs = keyOffset + pc;
          const noteLabel = getNote(abs);
          const isTonic = index === 0;
          // Tone-based animation handles highlighting — disable React state highlight to prevent doubling
          const isActive = false;

          return (
            <ScaleDegree
              key={pc}
              index={index}
              label={noteLabel}
              abs={abs}
              isTonic={isTonic}
              isActive={isActive}
              reduceAnimations={reduceAnimations}
              minimalHighlight={minimalHighlight}
              trailLength={trailLength}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onTogglePlay}
          className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-wide text-zinc-100 hover:bg-white/10 hover:border-white/25 transition-colors"
          title={isPlaying ? "Pause phrase" : "Play phrase"}
          aria-keyshortcuts="Control+Enter Meta+Enter"
        >
          <Play className="h-4 w-4" /> {isPlaying ? "Pause" : "Play"}
        </button>
      </div>
    </div>
  );
};

export default ScaleLegend;
