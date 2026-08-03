import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { DarkSelect } from '@/components/ui/dark-select';
import FieldLabel from '@/components/ui/field-label';
import { SoundType } from '@/audio';
import { TuningName } from '@/constants';
import { setFormState, useFormStore } from '@/store';
import { useApplySetting } from '@/hooks/useApplySetting';
import { TUNING_GROUP_OPTIONS } from './options';
import FormNumber from './FormNumber';
import FormToggle from './FormToggle';

type InstrumentControlsProps = { stopAllPlayback: () => void };

const SOUND_GROUPS: Array<{ label: string; options: Array<{ value: SoundType; label: string }> }> = [
  {
    label: 'Guitar & bass',
    options: [
      { value: 'guitar-clean', label: 'Guitar Clean' },
      { value: 'guitar-distorted', label: 'Guitar Distorted' },
      { value: 'bass', label: 'Bass' },
    ],
  },
  {
    label: 'Keys & percussion',
    options: [
      { value: 'marimba', label: 'Marimba' },
      { value: 'piano', label: 'Piano' },
      { value: 'organ', label: 'Organ' },
      { value: 'bells', label: 'Bells' },
    ],
  },
  {
    label: 'Orchestral',
    options: [
      { value: 'strings', label: 'Strings' },
      { value: 'flute', label: 'Flute' },
      { value: 'brass', label: 'Brass' },
    ],
  },
  {
    label: 'Synth',
    options: [
      { value: 'sine', label: 'Sine' },
      { value: 'square', label: 'Square' },
      { value: 'saw', label: 'Saw' },
      { value: 'synth-lead', label: 'Synth Lead' },
      { value: 'synth-pad', label: 'Synth Pad' },
    ],
  },
];

const InstrumentControls: React.FC<InstrumentControlsProps> = ({ stopAllPlayback }) => {
  const { tuningName, strings, frets, soundType, lowAtBottom } = useFormStore(useShallow((state) => ({
    tuningName: state.tuningName, strings: state.strings, frets: state.frets,
    soundType: state.soundType, lowAtBottom: state.lowAtBottom,
  })));

  const apply = useApplySetting(stopAllPlayback);

  return (
    <div className="flex flex-col gap-4">
      {/* Tuning + Sound */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <FieldLabel>Tuning</FieldLabel>
          <DarkSelect
            value={tuningName}
            onValueChange={(v) => apply({ tuningName: v as TuningName })}
            groups={TUNING_GROUP_OPTIONS}
            aria-label="Tuning"
          />
        </div>

        <div className="flex flex-col gap-1">
          <FieldLabel>Sound</FieldLabel>
          <DarkSelect
            value={soundType}
            onValueChange={(v) => apply({ soundType: v as SoundType })}
            groups={SOUND_GROUPS}
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
