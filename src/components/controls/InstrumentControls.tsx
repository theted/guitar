import React, { useCallback } from 'react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { SoundType } from '@/audio';
import { TuningName, tunings } from '@/constants';
import { setFormState, useFormStore, type FormState } from '@/store';
import FormNumber from './FormNumber';
import FormToggle from './FormToggle';

type InstrumentControlsProps = { stopAllPlayback: () => void };

const selectTriggerCls = "h-8 border-white/[0.08] bg-white/[0.05] text-white/80 text-xs focus:ring-cyan-500/50 hover:bg-white/[0.08] transition-colors";
const selectContentCls = "bg-[#0f0f1a] border border-white/[0.08] text-white/80";

const instrumentSounds: Array<{ type: SoundType; label: string }> = [
  { type: 'marimba', label: 'Marimba' },
  { type: 'sine', label: 'Sine' },
  { type: 'organ', label: 'Organ' },
  { type: 'piano', label: 'Piano' },
  { type: 'square', label: 'Square' },
  { type: 'saw', label: 'Saw' },
  { type: 'guitar-clean', label: 'Guitar Clean' },
  { type: 'guitar-distorted', label: 'Guitar Distorted' },
  { type: 'bass', label: 'Bass' },
  { type: 'synth-lead', label: 'Synth Lead' },
  { type: 'synth-pad', label: 'Synth Pad' },
  { type: 'bells', label: 'Bells' },
  { type: 'strings', label: 'Strings' },
  { type: 'flute', label: 'Flute' },
  { type: 'brass', label: 'Brass' },
];

const InstrumentControls: React.FC<InstrumentControlsProps> = ({ stopAllPlayback }) => {
  const { tuningName, strings, frets, soundType, lowAtBottom } = useFormStore((state) => ({
    tuningName: state.tuningName, strings: state.strings, frets: state.frets,
    soundType: state.soundType, lowAtBottom: state.lowAtBottom,
  }));

  const apply = useCallback((partial: Partial<FormState>) => {
    stopAllPlayback();
    setFormState(partial);
  }, [stopAllPlayback]);

  return (
    <div className="flex flex-col gap-4">
      {/* Tuning + Sound */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium uppercase tracking-wider text-white/40">Tuning</label>
          <Select value={tuningName} onValueChange={(v) => apply({ tuningName: v as TuningName })}>
            <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
            <SelectContent className={selectContentCls}>
              {Object.keys(tunings).map((t) => (
                <SelectItem key={t} value={t} className="text-xs focus:bg-white/[0.08] focus:text-white">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium uppercase tracking-wider text-white/40">Sound</label>
          <Select value={soundType} onValueChange={(v) => apply({ soundType: v as SoundType })}>
            <SelectTrigger className={selectTriggerCls}><SelectValue /></SelectTrigger>
            <SelectContent className={selectContentCls}>
              {instrumentSounds.map(({ type, label }) => (
                <SelectItem key={type} value={type} className="text-xs focus:bg-white/[0.08] focus:text-white">{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Strings + Frets */}
      <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-4">
        <div className="grid grid-cols-2 gap-2">
          <FormNumber id="strings" label="Strings" value={strings} min={1} max={12} stopAllPlayback={stopAllPlayback} onChange={(v) => setFormState({ strings: v })} />
          <FormNumber id="frets" label="Frets" value={frets} min={1} max={36} stopAllPlayback={stopAllPlayback} onChange={(v) => setFormState({ frets: v })} />
        </div>
        <FormToggle id="lowAtBottom" label="Low string at bottom" checked={lowAtBottom} stopAllPlayback={stopAllPlayback} onChange={(v) => setFormState({ lowAtBottom: v })} />
      </div>
    </div>
  );
};

export default InstrumentControls;
