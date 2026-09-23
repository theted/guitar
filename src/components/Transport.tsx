import React from 'react';
import cx from 'classnames';
import { ChevronUp, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { Picker } from '@/components/ui/select';
import { Segmented } from '@/components/ui/segmented';
import { Slider } from '@/components/ui/slider';
import { PATTERN_GROUPS, SOUND_GROUPS } from '@/components/controls/options';
import { setFormState, useFormStore } from '@/store';
import { useApplySetting } from '@/hooks/useApplySetting';
import type { PhraseMode } from '@/constants';
import type { SoundType } from '@/audio';

type TransportProps = {
  isPlaying: boolean;
  onTogglePlay: () => void;
  stopAllPlayback: () => void;
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

// Everything about *playing*: what to play, how fast, and what it sounds like.
// Settings that change the phrase stop playback; volume and mute never do.
const Transport: React.FC<TransportProps> = ({ isPlaying, onTogglePlay, stopAllPlayback }) => {
  const {
    phraseMode, phraseOctaves, phraseDescend, phraseLoop, swing, bpm, soundType,
    volume, muted, selectedPosition,
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
    selectedPosition: state.selectedPosition,
  })));

  const apply = useApplySetting(stopAllPlayback);
  // On phones only play and pattern show until the rest is asked for
  const [expanded, setExpanded] = React.useState(false);
  const more = expanded ? undefined : 'max-sm:hidden';
  // Position practice plays the box path directly; pattern and range don't apply
  const positionActive = selectedPosition != null;
  const positionHint = positionActive
    ? `Playing position ${selectedPosition}. Deselect it to choose a pattern.`
    : undefined;

  return (
    <div className="inverse border-t border-line pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-[1680px] flex-wrap items-end gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
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

        <Control label={positionActive ? `Position ${selectedPosition}` : 'Pattern'} className="w-48 grow sm:grow-0">
          <Picker
            value={phraseMode}
            onValueChange={(v) => apply({ phraseMode: v as PhraseMode })}
            groups={PATTERN_GROUPS}
            aria-label="Pattern"
            disabled={positionActive}
            title={positionHint}
          />
        </Control>

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

        <Control label="Octaves" className={more}>
          <div className={positionActive ? 'pointer-events-none opacity-40' : undefined} title={positionHint}>
            <Segmented
              aria-label="Octaves"
              value={phraseOctaves}
              onChange={(value) => apply({ phraseOctaves: value })}
              options={OCTAVE_OPTIONS}
            />
          </div>
        </Control>

        <div id="transport-more" className={cx('flex gap-1', more)}>
          <ToggleChip pressed={phraseDescend} onClick={() => apply({ phraseDescend: !phraseDescend })} title="Come back down after going up">
            Descend
          </ToggleChip>
          <ToggleChip pressed={phraseLoop} onClick={() => apply({ phraseLoop: !phraseLoop })} title="Repeat until stopped">
            Loop
          </ToggleChip>
          <ToggleChip pressed={swing} onClick={() => apply({ swing: !swing })} title="Swing the eighth notes">
            Swing
          </ToggleChip>
        </div>

        <Control label="Tempo" htmlFor="tempo" className={cx('w-full grow sm:w-56 sm:grow-0', more)}>
          <div className="flex h-9 items-center gap-3">
            <Slider
              id="tempo"
              min={30}
              max={700}
              step={5}
              value={bpm}
              onChange={(v) => apply({ bpm: v })}
              aria-valuetext={`${bpm} beats per minute`}
            />
            <span className="tabular w-16 shrink-0 text-sm font-semibold">
              {bpm} <span className="font-normal text-ink-3">bpm</span>
            </span>
          </div>
        </Control>

        <div className={cx('ml-auto flex items-end gap-x-6 gap-y-3 max-sm:w-full', more)}>
          <Control label="Sound" className="w-40 max-sm:grow">
            <Picker
              value={soundType}
              onValueChange={(v) => apply({ soundType: v as SoundType })}
              groups={SOUND_GROUPS}
              aria-label="Sound"
            />
          </Control>

          <Control label={muted ? 'Muted' : 'Volume'} htmlFor="volume" className="w-36">
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
