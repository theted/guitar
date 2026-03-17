import React, { useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { setFormState, useFormStore, type FormState } from '@/store';
import FormNumber from './FormNumber';
import FormToggle from './FormToggle';

type PlaybackControlsProps = { stopAllPlayback: () => void };

const PlaybackControls: React.FC<PlaybackControlsProps> = ({ stopAllPlayback }) => {
  const { bpm, trailLength, scheduleHorizon, swing, reduceAnimations } = useFormStore((state) => ({
    bpm: state.bpm, trailLength: state.trailLength, scheduleHorizon: state.scheduleHorizon,
    swing: state.swing, reduceAnimations: state.reduceAnimations,
  }));

  const apply = useCallback((partial: Partial<FormState>) => {
    stopAllPlayback();
    setFormState(partial);
  }, [stopAllPlayback]);

  return (
    <div className="flex flex-col gap-4">
      {/* BPM */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="bpm" className="text-[11px] font-medium uppercase tracking-wider text-white/40">BPM</label>
          <span className="text-xs font-mono text-white/60">{bpm}</span>
        </div>
        <Slider id="bpm" min={30} max={700} step={5} value={bpm} onChange={(v) => apply({ bpm: v })} />
      </div>

      {/* Trail */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="trailLength" className="text-[11px] font-medium uppercase tracking-wider text-white/40">Trail</label>
          <span className="text-xs font-mono text-white/60">{trailLength}ms</span>
        </div>
        <Slider id="trailLength" min={100} max={4000} step={50} value={trailLength} onChange={(v) => apply({ trailLength: v })} />
      </div>

      {/* Schedule horizon */}
      <FormNumber
        id="scheduleHorizon"
        label="Schedule horizon (ms)"
        value={scheduleHorizon}
        min={200}
        max={5000}
        step={100}
        stopAllPlayback={stopAllPlayback}
        onChange={(v) => setFormState({ scheduleHorizon: Math.min(5000, Math.max(200, v)) })}
      />

      {/* Toggles */}
      <div className="flex flex-col gap-2.5 border-t border-white/[0.06] pt-4">
        <FormToggle id="swing" label="Swing" checked={swing} stopAllPlayback={stopAllPlayback} onChange={(v) => setFormState({ swing: v })} />
        <FormToggle id="reduceAnimations" label="Reduce animations" checked={reduceAnimations} stopAllPlayback={stopAllPlayback} onChange={(v) => setFormState({ reduceAnimations: v })} />
      </div>
    </div>
  );
};

export default PlaybackControls;
