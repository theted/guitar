import React from 'react';
import cx from 'classnames';
import { ChevronUp, Minus, Pause, Play, Plus, Volume2, VolumeX, X } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { Picker } from '@/components/ui/select';
import { Segmented } from '@/components/ui/segmented';
import { Slider } from '@/components/ui/slider';
import { PATTERN_GROUPS, SOUND_GROUPS } from '@/components/controls/options';
import { setFormState, useFormStore } from '@/store';
import { useScalePositions } from '@/components/guitar/hooks/useScalePositions';
import PhraseStrip from '@/components/guitar/PhraseStrip';
import type { PhraseEvent } from '@/components/guitar/hooks/usePhraseEvents';
import { TEMPO, clampTempo, type PhraseMode } from '@/constants';
import type { SoundType } from '@/audio';

type TransportProps = {
  isPlaying: boolean;
  onTogglePlay: () => void;
  /** The phrase Play runs, shown note by note above the controls */
  events?: PhraseEvent[];
  /** How many octaves of the pattern fit on the neck */
  maxOctaves?: number;
};

const OCTAVE_OPTIONS = [1, 2, 3, 4, 5].map((value) => ({
  value,
  label: String(value),
  title: `${value} octave${value > 1 ? 's' : ''}`,
}));

const Control: React.FC<{ label: string; htmlFor?: string; children: React.ReactNode; className?: string }> = ({
  label, htmlFor, children, className,
}) => (
  <div className={cx('flex min-w-0 flex-col gap-1.5', className)}>
    <label htmlFor={htmlFor} className="text-xs font-medium text-ink-3">{label}</label>
    {children}
  </div>
);

const ToggleChip: React.FC<{ pressed: boolean; onClick: () => void; title: string; children: React.ReactNode }> = ({
  pressed, onClick, title, children,
}) => (
  <button
    type="button"
    aria-pressed={pressed}
    title={title}
    onClick={onClick}
    className={cx(
      'h-9 rounded-lg px-3 text-sm font-medium transition-colors',
      pressed ? 'bg-ink text-bg' : 'text-ink-2 ring-1 ring-inset ring-line hover:text-ink'
    )}
  >
    {children}
  </button>
);

const TempoStep: React.FC<{ label: string; onClick: () => void; children: React.ReactNode }> = ({ label, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={`${label} (${label === 'Faster' ? '↑' : '↓'})`}
    className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-ink-2 transition-colors hover:bg-surface hover:text-ink"
  >
    {children}
  </button>
);

// Everything about *playing*: what to play, how fast, and what it sounds like.
// Changes apply while playing: the phrase carries on from the same step with
// the new pattern, tempo or sound (see usePhrasePlayer).
const Transport: React.FC<TransportProps> = ({ isPlaying, onTogglePlay, events = [], maxOctaves = 5 }) => {
  const {
    phraseMode, phraseOctaves, phraseDescend, phraseLoop, swing, bpm, soundType,
    volume, muted,
  } = useFormStore(useShallow((state) => ({
    phraseMode: state.phraseMode,
    phraseOctaves: state.phraseOctaves,
    phraseDescend: state.phraseDescend,
    phraseLoop: state.phraseLoop,
    swing: state.swing,
    bpm: state.bpm,
    soundType: state.soundType,
    volume: state.volume,
    muted: state.muted,
  })));

  // On phones only play and pattern show until the rest is asked for
  const [expanded, setExpanded] = React.useState(false);
  const more = expanded ? undefined : 'max-sm:hidden';
  // Position practice plays the box itself, so pattern and range don't apply:
  // they make way for what is being practised and a way back to patterns
  const { activePosition } = useScalePositions();

  return (
    <div className="inverse border-t border-line pb-[env(safe-area-inset-bottom)]">
      {events.length > 0 && (
        <div className="border-b border-line">
          <div className="mx-auto max-w-[1680px] px-4 py-1.5 sm:px-6">
            <PhraseStrip events={events} />
          </div>
        </div>
      )}
      {/* Groups: what to play | how fast | how it sounds. The dividers only show
          once everything fits on one row; wrapped, they'd start a line. */}
      <div className="mx-auto flex max-w-[1680px] flex-wrap items-end gap-x-5 gap-y-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onTogglePlay}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-bg shadow-md transition-transform hover:scale-105 active:scale-95"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          aria-keyshortcuts="Space"
        >
          {isPlaying
            ? <Pause className="h-5 w-5" fill="currentColor" />
            : <Play className="ml-0.5 h-5 w-5" fill="currentColor" />}
        </button>

        {activePosition ? (
          <Control label="Practising" className="w-60 grow sm:grow-0">
            <div className="flex h-9 items-center justify-between gap-2 rounded-lg bg-surface pl-3 pr-1 ring-1 ring-inset ring-line">
              <span className="truncate text-sm">
                <span className="font-semibold">Position {activePosition.index}</span>
                <span className="tabular text-ink-3">, frets {activePosition.lowFret}–{activePosition.highFret}</span>
              </span>
              <button
                type="button"
                onClick={() => setFormState({ selectedPosition: null })}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-ink-2 transition-colors hover:bg-raised hover:text-ink"
                aria-label="Stop practising this position and play patterns"
                title="Back to patterns"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </Control>
        ) : (
          <Control label="Pattern" className="w-44 grow sm:grow-0">
            <Picker
              value={phraseMode}
              onValueChange={(v) => setFormState({ phraseMode: v as PhraseMode })}
              groups={PATTERN_GROUPS}
              aria-label="Pattern"
            />
          </Control>
        )}

        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          aria-controls="transport-more"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-2 ring-1 ring-inset ring-line sm:hidden"
          aria-label={expanded ? 'Fewer playback controls' : 'More playback controls'}
        >
          <ChevronUp className={cx('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
        </button>

        {!activePosition && (
          <Control label="Octaves" className={more}>
            <Segmented
              aria-label="Octaves"
              value={Math.min(phraseOctaves, maxOctaves)}
              onChange={(value) => setFormState({ phraseOctaves: value })}
              options={OCTAVE_OPTIONS.map((option) =>
                option.value > maxOctaves
                  ? { ...option, disabled: true, title: `Only ${maxOctaves} octave${maxOctaves > 1 ? 's' : ''} of this pattern fit on the neck` }
                  : option
              )}
            />
          </Control>
        )}

        <div id="transport-more" className={cx('flex gap-1', more)}>
          <ToggleChip pressed={phraseDescend} onClick={() => setFormState({ phraseDescend: !phraseDescend })} title="Come back down after going up">
            Descend
          </ToggleChip>
          <ToggleChip pressed={phraseLoop} onClick={() => setFormState({ phraseLoop: !phraseLoop })} title="Repeat until stopped">
            Loop
          </ToggleChip>
          <ToggleChip pressed={swing} onClick={() => setFormState({ swing: !swing })} title="Swing the eighth notes">
            Swing
          </ToggleChip>
        </div>

        <Control label="Tempo" htmlFor="tempo" className={cx('w-full grow sm:w-64 sm:grow-0 min-[1400px]:border-l min-[1400px]:border-line min-[1400px]:pl-5', more)}>
          <div className="flex h-9 items-center gap-1">
            <TempoStep label="Slower" onClick={() => setFormState({ bpm: clampTempo(bpm - TEMPO.STEP) })}>
              <Minus className="h-3.5 w-3.5" />
            </TempoStep>
            <Slider
              id="tempo"
              min={TEMPO.MIN}
              max={TEMPO.MAX}
              step={TEMPO.STEP}
              value={bpm}
              onChange={(v) => setFormState({ bpm: v })}
              aria-valuetext={`${bpm} beats per minute`}
              className="mx-1"
            />
            <TempoStep label="Faster" onClick={() => setFormState({ bpm: clampTempo(bpm + TEMPO.STEP) })}>
              <Plus className="h-3.5 w-3.5" />
            </TempoStep>
            <span className="tabular ml-2 w-16 shrink-0 text-sm font-semibold">
              {bpm} <span className="font-normal text-ink-3">bpm</span>
            </span>
          </div>
        </Control>

        <div className={cx('ml-auto flex items-end gap-x-5 gap-y-3 max-sm:w-full min-[1400px]:border-l min-[1400px]:border-line min-[1400px]:pl-5', more)}>
          <Control label="Sound" className="w-48 max-sm:grow">
            <Picker
              value={soundType}
              onValueChange={(v) => setFormState({ soundType: v as SoundType })}
              groups={SOUND_GROUPS}
              aria-label="Sound"
            />
          </Control>

          <Control label={muted ? 'Muted' : 'Volume'} htmlFor="volume" className="w-32">
            <div className="flex h-9 items-center gap-2">
              <button
                type="button"
                onClick={() => setFormState({ muted: !muted })}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-ink-2 transition-colors hover:bg-surface hover:text-ink"
                aria-label={muted ? 'Unmute' : 'Mute'}
                aria-pressed={muted}
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <Slider
                id="volume"
                min={0}
                max={100}
                value={muted ? 0 : volume}
                onChange={(v) => setFormState({ volume: v, muted: false })}
                aria-valuetext={muted ? 'muted' : `${volume}%`}
              />
            </div>
          </Control>
        </div>
      </div>
    </div>
  );
};

export default Transport;
