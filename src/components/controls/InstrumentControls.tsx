import React, { useCallback } from 'react';
import { DarkSelect } from '@/components/ui/dark-select';
import FieldLabel from '@/components/ui/field-label';
import { SoundType } from '@/audio';
import { TuningName, tunings } from '@/constants';
import { setFormState, useFormStore, type FormState } from '@/store';
import FormNumber from './FormNumber';
import FormToggle from './FormToggle';

type InstrumentControlsProps = { stopAllPlayback: () => void };

const TUNING_OPTIONS = Object.keys(tunings).map((t) => ({ value: t, label: t }));

const SOUND_OPTIONS: Array<{ value: SoundType; label: string }> = [
  { value: 'marimba', label: 'Marimba' },
  { value: 'sine', label: 'Sine' },
  { value: 'organ', label: 'Organ' },
  { value: 'piano', label: 'Piano' },
  { value: 'square', label: 'Square' },
  { value: 'saw', label: 'Saw' },
  { value: 'guitar-clean', label: 'Guitar Clean' },
  { value: 'guitar-distorted', label: 'Guitar Distorted' },
  { value: 'bass', label: 'Bass' },
  { value: 'synth-lead', label: 'Synth Lead' },
  { value: 'synth-pad', label: 'Synth Pad' },
  { value: 'bells', label: 'Bells' },
  { value: 'strings', label: 'Strings' },
  { value: 'flute', label: 'Flute' },
  { value: 'brass', label: 'Brass' },
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
          <FieldLabel>Tuning</FieldLabel>
          <DarkSelect
            value={tuningName}
            onValueChange={(v) => apply({ tuningName: v as TuningName })}
            options={TUNING_OPTIONS}
            aria-label="Tuning"
          />
        </div>

        <div className="flex flex-col gap-1">
          <FieldLabel>Sound</FieldLabel>
          <DarkSelect
            value={soundType}
            onValueChange={(v) => apply({ soundType: v as SoundType })}
            options={SOUND_OPTIONS}
            aria-label="Sound"
          />
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
