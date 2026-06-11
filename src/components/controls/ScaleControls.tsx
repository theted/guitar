import React, { useCallback } from 'react';
import { DarkSelect } from '@/components/ui/dark-select';
import FieldLabel from '@/components/ui/field-label';
import { PhraseMode, ScaleName, KeyName, scales, KEYS, PHRASE_MODE_GROUPS } from '@/constants';
import { parseKey, formatNote } from '@/theory/spelling';
import { ucFirst } from '@/lib/utils';
import { setFormState, useFormStore, type FormState } from '@/store';
import FormToggle from './FormToggle';

type ScaleControlsProps = { stopAllPlayback: () => void };

const SCALE_OPTIONS = Object.keys(scales).map((s) => ({ value: s, label: ucFirst(s) }));
const KEY_OPTIONS = KEYS.map((k) => ({ value: k, label: formatNote(parseKey(k)) }));
const OCTAVE_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((o) => ({
  value: String(o),
  label: String(o),
}));
const PHRASE_OCTAVE_OPTIONS = [1, 2, 3, 4, 5].map((o) => ({
  value: String(o),
  label: `${o} octave${o > 1 ? 's' : ''}`,
}));
const PHRASE_GROUPS = PHRASE_MODE_GROUPS.map((group) => ({
  label: group.label,
  options: group.modes.map((mode) => ({ value: mode.value, label: mode.label })),
}));

const ScaleControls: React.FC<ScaleControlsProps> = ({ stopAllPlayback }) => {
  const {
    scale, tone, startOctave, phraseMode, phraseOctaves, phraseDescend, phraseLoop,
    oncePerTone, highlightEnabled, legendOnly, octaveHighlight, minimalHighlight,
  } = useFormStore((state) => ({
    scale: state.scale, tone: state.tone, startOctave: state.startOctave,
    phraseMode: state.phraseMode, phraseOctaves: state.phraseOctaves,
    phraseDescend: state.phraseDescend, phraseLoop: state.phraseLoop,
    oncePerTone: state.oncePerTone, highlightEnabled: state.highlightEnabled,
    legendOnly: state.legendOnly, octaveHighlight: state.octaveHighlight,
    minimalHighlight: state.minimalHighlight,
  }));

  const apply = useCallback((partial: Partial<FormState>) => {
    stopAllPlayback();
    setFormState(partial);
  }, [stopAllPlayback]);

  return (
    <div className="flex flex-col gap-4">
      {/* Scale + Key */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <FieldLabel>Scale</FieldLabel>
          <DarkSelect
            value={scale}
            onValueChange={(v) => apply({ scale: v as ScaleName })}
            options={SCALE_OPTIONS}
            aria-label="Scale"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <FieldLabel>Key</FieldLabel>
            <DarkSelect
              value={tone}
              onValueChange={(v) => apply({ tone: v as KeyName })}
              options={KEY_OPTIONS}
              aria-label="Key"
            />
          </div>
          <div className="flex flex-col gap-1">
            <FieldLabel>Octave</FieldLabel>
            <DarkSelect
              value={String(startOctave)}
              onValueChange={(v) => apply({ startOctave: parseInt(v, 10) })}
              options={OCTAVE_OPTIONS}
              aria-label="Octave"
            />
          </div>
        </div>
      </div>

      {/* Phrase */}
      <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-4">
        <FieldLabel>Phrase</FieldLabel>
        <DarkSelect
          value={phraseMode}
          onValueChange={(v) => apply({ phraseMode: v as PhraseMode })}
          groups={PHRASE_GROUPS}
          aria-label="Phrase mode"
        />

        <div className="flex flex-col gap-1">
          <FieldLabel>Octaves</FieldLabel>
          <DarkSelect
            value={String(phraseOctaves)}
            onValueChange={(v) => apply({ phraseOctaves: parseInt(v, 10) })}
            options={PHRASE_OCTAVE_OPTIONS}
            aria-label="Phrase octaves"
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <FormToggle id="phraseDescend" label="Descend" checked={phraseDescend} stopAllPlayback={stopAllPlayback} onChange={(v) => setFormState({ phraseDescend: v })} />
          <FormToggle id="phraseLoop" label="Loop" checked={phraseLoop} stopAllPlayback={stopAllPlayback} onChange={(v) => setFormState({ phraseLoop: v })} />
          <FormToggle id="oncePerTone" label="Once per tone" checked={oncePerTone} stopAllPlayback={stopAllPlayback} onChange={(v) => setFormState({ oncePerTone: v })} />
        </div>
      </div>

      {/* Highlights */}
      <div className="flex flex-col gap-2.5 border-t border-white/[0.06] pt-4">
        <FieldLabel>Highlights</FieldLabel>
        <FormToggle id="highlightEnabled" label="Highlight notes" checked={highlightEnabled} stopAllPlayback={stopAllPlayback} onChange={(v) => setFormState({ highlightEnabled: v })} />
        <FormToggle id="legendOnly" label="Legend only" checked={legendOnly} stopAllPlayback={stopAllPlayback} onChange={(v) => setFormState({ legendOnly: v })} />
        <FormToggle id="octaveHighlight" label="Octave highlight" checked={octaveHighlight} stopAllPlayback={stopAllPlayback} onChange={(v) => setFormState({ octaveHighlight: v })} />
        <FormToggle id="minimalHighlight" label="Minimal highlight" checked={minimalHighlight} stopAllPlayback={stopAllPlayback} onChange={(v) => setFormState({ minimalHighlight: v })} />
      </div>
    </div>
  );
};

export default ScaleControls;
