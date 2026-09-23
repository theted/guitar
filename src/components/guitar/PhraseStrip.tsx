import React, { useMemo } from 'react';
import cx from 'classnames';
import { useShallow } from 'zustand/react/shallow';
import { getScalePitchClasses, keyToOffset } from '@/music';
import { getSpellingMap, formatNoteWithOctave } from '@/theory/spelling';
import { relativeTo } from '@/theory/pitch';
import { scales } from '@/constants';
import { toneAnimationManager } from '@/lib/tone-animation';
import { pretty } from '@/lib/notation';
import { useFormStore } from '@/store';
import type { PhraseEvent } from './hooks/usePhraseEvents';

type StepProps = {
  index: number;
  label: string;
  isTonic: boolean;
  /** First note of an octave pass — gets a divider to show the phrase's shape */
  startsGroup: boolean;
};

// Memoized on primitives: rebuilding the event list (a BPM change, say) leaves
// every step untouched, so the registry entries survive.
const PhraseStep: React.FC<StepProps> = React.memo(({ index, label, isTonic, startsGroup }) => {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    toneAnimationManager.registerStep(element, index);
    return () => { toneAnimationManager.clearStep(element); };
  }, [index]);

  return (
    <div
      ref={ref}
      className={cx(
        'tabular relative shrink-0 select-none rounded-md px-1.5 py-1 text-xs font-medium',
        startsGroup ? 'ml-3' : '',
        isTonic ? 'text-ink shadow-[inset_0_-3px_0_var(--tonic)]' : 'text-ink-2'
      )}
    >
      {label}
      <span className="tone-overlay" />
    </div>
  );
});

type Props = {
  events: PhraseEvent[];
};

/**
 * The phrase as it will be played, note by note. Each step lights up on its
 * beat and the strip scrolls to follow, so a long run stays readable.
 */
const PhraseStrip: React.FC<Props> = ({ events }) => {
  const { scale, keyy } = useFormStore(
    useShallow((state) => ({ scale: state.scale, keyy: state.tone }))
  );
  const viewportRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    toneAnimationManager.setStepViewport(viewportRef.current);
    return () => { toneAnimationManager.setStepViewport(null); };
  }, []);

  const keyOffset = useMemo(() => keyToOffset(keyy), [keyy]);
  const spellingMap = useMemo(
    () => getSpellingMap(keyy, getScalePitchClasses(scales[scale])),
    [keyy, scale]
  );

  // Rebuilt whenever the event list is, but the steps below are memoized on
  // primitives — a tempo change re-runs this and touches no DOM.
  const steps = useMemo(
    () =>
      events.map(({ abs }, index) => {
        const isTonic = relativeTo(abs, keyOffset) === 0;
        return {
          label: pretty(formatNoteWithOctave(abs, spellingMap)),
          isTonic,
          // Each pass through the scale restarts on the tonic
          startsGroup: index > 0 && isTonic,
        };
      }),
    [events, spellingMap, keyOffset]
  );

  if (steps.length === 0) return null;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="tabular shrink-0 text-xs font-medium text-ink-3">
        {steps.length} notes
      </span>
      <div
        ref={viewportRef}
        className="phrase-strip flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [mask-image:linear-gradient(90deg,transparent,#000_1.5rem,#000_calc(100%-1.5rem),transparent)] px-6"
        role="group"
        aria-label={`Phrase — ${steps.length} notes`}
      >
        {steps.map((step, index) => (
          <PhraseStep
            key={index}
            index={index}
            label={step.label}
            isTonic={step.isTonic}
            startsGroup={step.startsGroup}
          />
        ))}
      </div>
    </div>
  );
};

export default PhraseStrip;
