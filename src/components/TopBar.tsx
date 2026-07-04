import React, { useCallback } from 'react';
import { Play, Pause, Settings } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { DarkSelect } from '@/components/ui/dark-select';
import { Slider } from '@/components/ui/slider';
import { SCALE_GROUP_OPTIONS, KEY_OPTIONS } from '@/components/controls/options';
import { setFormState, useFormStore, type FormState } from '@/store';
import type { ScaleName, KeyName } from '@/constants';

type TopBarProps = {
  isPlaying: boolean;
  onTogglePlay: () => void;
  stopAllPlayback: () => void;
  onOpenSettings: () => void;
};

// Always-visible bar with the core controls: key, scale, play and tempo.
// Everything else lives in the settings drawer.
const TopBar: React.FC<TopBarProps> = ({
  isPlaying,
  onTogglePlay,
  stopAllPlayback,
  onOpenSettings,
}) => {
  const { scale, tone, bpm } = useFormStore(useShallow((state) => ({
    scale: state.scale,
    tone: state.tone,
    bpm: state.bpm,
  })));

  const apply = useCallback((partial: Partial<FormState>) => {
    stopAllPlayback();
    setFormState(partial);
  }, [stopAllPlayback]);

  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-12 flex items-center gap-3 px-4 border-b border-white/[0.06] bg-black/60 backdrop-blur-md">
      <span
        className="hidden lg:block text-white/80 text-[11px] font-bold uppercase tracking-[0.22em] whitespace-nowrap [font-stretch:125%]"
      >
        Guitar Scale Finder
      </span>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="w-[72px] shrink-0">
          <DarkSelect
            value={tone}
            onValueChange={(v) => apply({ tone: v as KeyName })}
            options={KEY_OPTIONS}
            aria-label="Key"
          />
        </div>
        <div className="w-36 sm:w-44 shrink-0">
          <DarkSelect
            value={scale}
            onValueChange={(v) => apply({ scale: v as ScaleName })}
            groups={SCALE_GROUP_OPTIONS}
            aria-label="Scale"
          />
        </div>

        <button
          type="button"
          onClick={onTogglePlay}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 h-8 text-xs font-semibold text-cyan-950 hover:bg-cyan-300 active:scale-95 transition-all duration-150 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50"
          title={isPlaying ? 'Pause phrase (Space)' : 'Play phrase (Space)'}
          aria-keyshortcuts="Space"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Play'}</span>
        </button>

        <div className="hidden md:flex items-center gap-2 w-44 shrink-0">
          <Slider
            id="topbar-bpm"
            min={30}
            max={700}
            step={5}
            value={bpm}
            onChange={(v) => apply({ bpm: v })}
            className="flex-1"
          />
          <span className="text-xs text-white/60 w-14 whitespace-nowrap tabular-nums">{bpm} bpm</span>
        </div>
      </div>

      <button
        onClick={onOpenSettings}
        className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-white/[0.08] bg-white/[0.05] text-white/60 hover:text-white/90 hover:bg-white/[0.09] transition-all text-xs uppercase tracking-widest font-medium shrink-0"
        aria-label="Open settings"
      >
        <Settings className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Settings</span>
      </button>
    </header>
  );
};

export default TopBar;
