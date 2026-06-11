import React, { useMemo } from 'react';
import cx from 'classnames';
import { useShallow } from 'zustand/react/shallow';
import { getScalePitchClasses } from '@/music';
import { getDiatonicChords } from '@/theory/chords';
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
    <div className="mb-4 flex flex-wrap items-center gap-1.5" role="group" aria-label="Diatonic chords">
      {chords.map((chord) => {
        const active = selectedChordDegree === chord.degree;
        return (
          <button
            key={chord.degree}
            type="button"
            aria-pressed={active}
            onClick={() => setFormState({ selectedChordDegree: active ? null : chord.degree })}
            title={chord.seventhName ? `${chord.name} · ${chord.seventhName}` : chord.name}
            className={cx(
              'px-2 py-1 rounded-md border text-xs transition-colors select-none',
              active
                ? 'bg-cyan-500/20 text-cyan-100 border-cyan-400/70'
                : 'bg-white/[0.04] text-white/60 border-white/[0.08] hover:bg-white/[0.08] hover:text-white/80'
            )}
          >
            <span className="font-semibold">{chord.roman}</span>
            <span className={cx('ml-1.5', active ? 'text-cyan-200/80' : 'text-white/40')}>
              {chord.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ChordStrip;
