import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Picker } from '@/components/ui/select';
import { Segmented } from '@/components/ui/segmented';
import { Stepper } from '@/components/ui/stepper';
import { Slider } from '@/components/ui/slider';
import { SwitchRow } from '@/components/ui/switch-row';
import FieldLabel from '@/components/ui/field-label';
import { TuningName } from '@/constants';
import { setFormState, useFormStore } from '@/store';
import { useApplySetting } from '@/hooks/useApplySetting';
import { TUNING_GROUP_OPTIONS } from './options';

type SetupControlsProps = { stopAllPlayback: () => void };

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="flex flex-col gap-4 border-t border-line px-5 py-5 first:border-t-0">
    <h3 className="type-wide text-sm font-bold text-ink">{title}</h3>
    {children}
  </section>
);

const Row: React.FC<{ label: string; htmlFor?: string; children: React.ReactNode }> = ({ label, htmlFor, children }) => (
  <div className="flex items-center justify-between gap-4">
    <FieldLabel htmlFor={htmlFor} className="text-sm font-normal text-ink">{label}</FieldLabel>
    {children}
  </div>
);

const SPAN_OPTIONS = [4, 5, 6].map((value) => ({ value, label: `${value} frets` }));

const SHORTCUTS: Array<[string, string]> = [
  ['Space', 'Play or pause'],
  ['Esc', 'Stop'],
  ['↑ ↓', 'Tempo up or down'],
];

// Set-once configuration: the instrument, and how the neck is drawn.
// Everything used while practising lives on the page itself.
const SetupControls: React.FC<SetupControlsProps> = ({ stopAllPlayback }) => {
  const s = useFormStore(useShallow((state) => ({
    tuningName: state.tuningName,
    strings: state.strings,
    frets: state.frets,
    startOctave: state.startOctave,
    lowAtBottom: state.lowAtBottom,
    positionSpan: state.positionSpan,
    highlightEnabled: state.highlightEnabled,
    singleStringScale: state.singleStringScale,
    octaveHighlight: state.octaveHighlight,
    trailLength: state.trailLength,
    reduceAnimations: state.reduceAnimations,
  })));

  const apply = useApplySetting(stopAllPlayback);

  return (
    <div className="flex flex-col">
      <Section title="Instrument">
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Tuning</FieldLabel>
          <Picker
            value={s.tuningName}
            onValueChange={(v) => apply({ tuningName: v as TuningName })}
            groups={TUNING_GROUP_OPTIONS}
            aria-label="Tuning"
          />
        </div>
        <Row label="Strings">
          <Stepper aria-label="Strings" value={s.strings} min={1} max={12} onChange={(v) => apply({ strings: v })} />
        </Row>
        <Row label="Frets">
          <Stepper aria-label="Frets" value={s.frets} min={1} max={36} onChange={(v) => apply({ frets: v })} />
        </Row>
        <Row label="Pitch">
          <Stepper
            aria-label="Octave"
            value={s.startOctave}
            min={0}
            max={9}
            format={(v) => `Octave ${v}`}
            onChange={(v) => apply({ startOctave: v })}
          />
        </Row>
        <SwitchRow
          id="lowAtBottom"
          label="Low string at the bottom"
          hint="As in tab. Turn off to see the neck the way you look down at it while playing."
          checked={s.lowAtBottom}
          onChange={(v) => apply({ lowAtBottom: v })}
        />
      </Section>

      <Section title="Positions">
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Hand span</FieldLabel>
          <Segmented
            aria-label="Position hand span"
            value={s.positionSpan}
            onChange={(v) => apply({ positionSpan: v, selectedPosition: null })}
            options={SPAN_OPTIONS}
          />
          <p className="text-xs leading-snug text-ink-3">
            How many frets one position covers. Wider spans need fewer shifts but more stretch.
          </p>
        </div>
      </Section>

      <Section title="Display">
        <div className="flex flex-col">
          <SwitchRow
            id="highlightEnabled"
            label="Show the scale"
            hint="Turn off to test yourself on a bare neck. Played notes still light up."
            checked={s.highlightEnabled}
            onChange={(v) => setFormState({ highlightEnabled: v })}
          />
          <SwitchRow
            id="singleStringScale"
            label="Lowest string only"
            hint="Mark the scale along one string, so each note appears once."
            checked={s.singleStringScale}
            onChange={(v) => setFormState({ singleStringScale: v })}
          />
          <SwitchRow
            id="octaveHighlight"
            label="Light up the played octave only"
            hint="Off lights the same note in every octave."
            checked={s.octaveHighlight}
            onChange={(v) => setFormState({ octaveHighlight: v })}
          />
          <SwitchRow
            id="reduceAnimations"
            label="Reduce motion"
            hint="Short flashes, no hover movement."
            checked={s.reduceAnimations}
            onChange={(v) => setFormState({ reduceAnimations: v })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="trailLength">Note glow</FieldLabel>
            <span className="tabular text-xs text-ink-2">{(s.trailLength / 1000).toFixed(1)} s</span>
          </div>
          <Slider
            id="trailLength"
            min={100}
            max={4000}
            step={50}
            value={s.trailLength}
            onChange={(v) => setFormState({ trailLength: v })}
            aria-valuetext={`${s.trailLength} milliseconds`}
          />
          <p className="text-xs leading-snug text-ink-3">How long a played note stays lit.</p>
        </div>
      </Section>

      <Section title="Keyboard">
        <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-sm">
          {SHORTCUTS.map(([keys, action]) => (
            <React.Fragment key={keys}>
              <dt>
                <kbd className="rounded-md bg-surface px-2 py-0.5 text-xs font-semibold text-ink ring-1 ring-inset ring-line">
                  {keys}
                </kbd>
              </dt>
              <dd className="text-ink-2">{action}</dd>
            </React.Fragment>
          ))}
        </dl>
      </Section>
    </div>
  );
};

export default SetupControls;
