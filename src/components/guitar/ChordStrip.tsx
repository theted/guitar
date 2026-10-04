import React, { useMemo } from 'react';
import cx from 'classnames';
import { useShallow } from 'zustand/react/shallow';
import { getScalePitchClasses } from '@/music';
import { getDiatonicChords } from '@/theory/chords';
import { pretty } from '@/lib/notation';
import { scales } from '@/constants';
import { setFormState, useFormStore } from '@/store';

// Diatonic chord buttons (I ii iii …). Selecting one highlights its chord
// tones on the fretboard; only rendered for heptatonic scales.
const ChordStrip: React.FC = () => {
  const { scale, keyy, selectedChordDegree } = useFormStore(useShallow((state) => ({
    scale: state.scale,
    keyy: state.tone,
    selectedChordDegree: state.selectedChordDegree,
  })));

  const chords = useMemo(
    () => getDiatonicChords(keyy, getScalePitchClasses(scales[scale])),
    [keyy, scale]
  );


  if (chords.length === 0) return null;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="shrink-0 text-xs font-medium text-ink-3" title="The chords built on each note of the scale">Chords</span>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Diatonic chords">
        {chords.map((chord) => {
          const active = selectedChordDegree === chord.degree;
          return (
            <button
              key={chord.degree}
              type="button"
              aria-pressed={active}
              onClick={() => setFormState({ selectedChordDegree: active ? null : chord.degree })}
              title={chord.seventhName ? `${pretty(chord.name)}, or ${pretty(chord.seventhName)} with the 7th` : pretty(chord.name)}
              className={cx(
                'inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm transition-colors select-none',
                active
                  ? 'bg-chord text-chord-ink'
                  : 'text-ink ring-1 ring-inset ring-line hover:bg-surface'
              )}
            >
              <span className={cx('text-xs font-semibold', active ? 'text-chord-ink/80' : 'text-ink-3')}>
                {chord.roman}
              </span>
              <span className="font-semibold">{pretty(chord.name)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChordStrip;
