import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Slider } from '@/components/ui/slider';
import FieldLabel from '@/components/ui/field-label';
import { setFormState, useFormStore } from '@/store';
import { useApplySetting } from '@/hooks/useApplySetting';
import FormToggle from './FormToggle';

type PlaybackControlsProps = { stopAllPlayback: () => void };

const PlaybackControls: React.FC<PlaybackControlsProps> = ({ stopAllPlayback }) => {
  const { bpm, trailLength, volume, muted, swing, reduceAnimations } = useFormStore(useShallow((state) => ({
    bpm: state.bpm, trailLength: state.trailLength, volume: state.volume, muted: state.muted,
    swing: state.swing, reduceAnimations: state.reduceAnimations,
  })));

  const apply = useApplySetting(stopAllPlayback);

  return (
    <div className="flex flex-col gap-4">
      {/* BPM */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <FieldLabel htmlFor="bpm">BPM</FieldLabel>
          <span className="text-xs font-mono text-white/60">{bpm}</span>
        </div>
        <Slider id="bpm" min={30} max={700} step={5} value={bpm} onChange={(v) => apply({ bpm: v })} />
      </div>

      {/* Trail */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <FieldLabel htmlFor="trailLength">Trail</FieldLabel>
          <span className="text-xs font-mono text-white/60">{trailLength}ms</span>
        </div>
        <Slider id="trailLength" min={100} max={4000} step={50} value={trailLength} onChange={(v) => apply({ trailLength: v })} />
      </div>

      {/* Volume */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <FieldLabel htmlFor="volume">Volume</FieldLabel>
          <span className="text-xs font-mono text-white/60">{muted ? 'muted' : `${volume}%`}</span>
        </div>
        <Slider
          id="volume"
          min={0}
          max={100}
          step={1}
          value={volume}
          onChange={(v) => setFormState({ volume: v, muted: false })}
        />
      </div>

      {/* Toggles */}
      <div className="flex flex-col gap-2.5 border-t border-white/[0.06] pt-4">
        <FormToggle id="muted" label="Mute" checked={muted} onChange={(v) => setFormState({ muted: v })} />
        <FormToggle id="swing" label="Swing" checked={swing} stopAllPlayback={stopAllPlayback} onChange={(v) => setFormState({ swing: v })} />
        <FormToggle id="reduceAnimations" label="Reduce animations" checked={reduceAnimations} stopAllPlayback={stopAllPlayback} onChange={(v) => setFormState({ reduceAnimations: v })} />
      </div>
    </div>
  );
};

export default PlaybackControls;
