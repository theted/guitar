import React, { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { DarkSelect } from '@/components/ui/dark-select';
import FieldLabel from '@/components/ui/field-label';
import { PhraseMode, ScaleName, KeyName, PHRASE_MODE_GROUPS } from '@/constants';
import { setFormState, useFormStore, type FormState } from '@/store';
import { SCALE_GROUP_OPTIONS, KEY_OPTIONS } from './options';
import { useRiffs } from '@/components/guitar/hooks/useRiffs';
import FormToggle from './FormToggle';

type ScaleControlsProps = { stopAllPlayback: () => void };

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
const POSITION_SPAN_OPTIONS = [4, 5, 6].map((s) => ({
  value: String(s),
  label: `${s} frets`,
}));

const ScaleControls: React.FC<ScaleControlsProps> = ({ stopAllPlayback }) => {
  const {
    scale, tone, startOctave, phraseMode, phraseOctaves, phraseDescend, phraseLoop,
    oncePerTone, octaveHighlight, minimalHighlight,
    selectedPosition, positionSpan,
  } = useFormStore(useShallow((state) => ({
    scale: state.scale, tone: state.tone, startOctave: state.startOctave,
    phraseMode: state.phraseMode, phraseOctaves: state.phraseOctaves,
    phraseDescend: state.phraseDescend, phraseLoop: state.phraseLoop,
    oncePerTone: state.oncePerTone, octaveHighlight: state.octaveHighlight,
    minimalHighlight: state.minimalHighlight,
    selectedPosition: state.selectedPosition, positionSpan: state.positionSpan,
  })));

  const { activeRiff } = useRiffs();
  // Position practice and demo riffs both replace the phrase pattern
  const phraseBypassed = selectedPosition != null || activeRiff != null;
  const bypassReason = selectedPosition != null ? 'a position' : 'a riff';

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
            groups={SCALE_GROUP_OPTIONS}
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
        {/* Position practice and riffs play their own line; phrase shape doesn't apply */}
        <div
          className={phraseBypassed ? 'opacity-40 pointer-events-none' : undefined}
          title={phraseBypassed ? `Phrase patterns are paused while ${bypassReason} is selected — deselect it above the fretboard to use them` : undefined}
          aria-disabled={phraseBypassed || undefined}
        >
          <DarkSelect
            value={phraseMode}
            onValueChange={(v) => apply({ phraseMode: v as PhraseMode })}
            groups={PHRASE_GROUPS}
            aria-label="Phrase mode"
          />
        </div>

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

      {/* Positions */}
      <div className="flex flex-col gap-1 border-t border-white/[0.06] pt-4">
        <FieldLabel>Position span</FieldLabel>
        <DarkSelect
          value={String(positionSpan)}
          onValueChange={(v) => apply({ positionSpan: parseInt(v, 10), selectedPosition: null })}
          options={POSITION_SPAN_OPTIONS}
          aria-label="Position span"
        />
      </div>

      {/* Highlights */}
      <div className="flex flex-col gap-2.5 border-t border-white/[0.06] pt-4">
        <FieldLabel>Highlights</FieldLabel>
        <FormToggle id="octaveHighlight" label="Flash played octave only" title="When playing a note, flash only the frets in the same octave instead of every octave of that note" checked={octaveHighlight} stopAllPlayback={stopAllPlayback} onChange={(v) => setFormState({ octaveHighlight: v })} />
        <FormToggle id="minimalHighlight" label="Minimal highlight" title="Hide degree badges and keep note flashes short" checked={minimalHighlight} stopAllPlayback={stopAllPlayback} onChange={(v) => setFormState({ minimalHighlight: v })} />
      </div>
    </div>
  );
};

export default ScaleControls;
