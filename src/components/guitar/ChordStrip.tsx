import React, { useMemo } from 'react';
import cx from 'classnames';
import { useShallow } from 'zustand/react/shallow';
import { getScalePitchClasses } from '@/music';
import { chordLabel, chordRelativeNames, getDiatonicChords, type DiatonicChord } from '@/theory/chords';
import { pretty } from '@/lib/notation';
import { scales } from '@/constants';
import { Segmented } from '@/components/ui/segmented';
import { setFormState, useFormStore } from '@/store';
import type { PitchClass } from '@/types/music';

type Props = {
  /** Sound the chord that was just picked */
  onStrumChord?: (degree: number) => void;
};

const SIZE_OPTIONS = [
  { value: 'triads', label: 'Triads', title: 'Three-note chords: root, 3rd and 5th' },
  { value: 'sevenths', label: '7ths', title: 'Four-note chords: the triad plus its 7th' },
] as const;

// "Dm7: D F A C (R ♭3 5 ♭7)"
const formula = (chord: DiatonicChord, sevenths: boolean, pcs: readonly PitchClass[]): string => {
  const { name } = chordLabel(chord, sevenths);
  const count = sevenths ? 4 : 3;
  const names = chordRelativeNames(pcs, chord.degree - 1);
  const intervals = [0, 2, 4, 6].slice(0, count).map((offset) => names[(chord.degree - 1 + offset) % 7]);
  const notes = chord.noteNames.slice(0, count).map(pretty);
  return `${pretty(name)}: ${notes.join(' ')} (${intervals.join(' ')})`;
};

// The diatonic chords (I ii iii …). Selecting one practises it: the neck shows
// its tones, Play arpeggiates it (see Transport), and it sounds as it's picked.
// Only rendered for heptatonic scales.
const ChordStrip: React.FC<Props> = ({ onStrumChord }) => {
  const { scale, keyy, selectedChordDegree, sevenths } = useFormStore(useShallow((state) => ({
    scale: state.scale,
    keyy: state.tone,
    selectedChordDegree: state.selectedChordDegree,
    sevenths: state.chordSevenths,
  })));

  const pcs = useMemo(() => getScalePitchClasses(scales[scale]), [scale]);
  const chords = useMemo(() => getDiatonicChords(keyy, pcs), [keyy, pcs]);

  if (chords.length === 0) return null;

  const pick = (degree: number) => {
    if (selectedChordDegree === degree) {
      setFormState({ selectedChordDegree: null });
      return;
    }
    setFormState({ selectedChordDegree: degree });
    onStrumChord?.(degree);
  };

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
      <span className="shrink-0 text-xs font-medium text-ink-3" title="The chords built on each note of the scale">Chords</span>
      <Segmented
        aria-label="Chord size"
        size="sm"
        value={sevenths ? 'sevenths' : 'triads'}
        onChange={(value) => setFormState({ chordSevenths: value === 'sevenths' })}
        options={SIZE_OPTIONS}
      />
      <div className="flex flex-wrap gap-1" role="group" aria-label="Diatonic chords">
        {chords.map((chord) => {
          const active = selectedChordDegree === chord.degree;
          const { roman, name } = chordLabel(chord, sevenths);
          return (
            <button
              key={chord.degree}
              type="button"
              aria-pressed={active}
              onClick={() => pick(chord.degree)}
              title={formula(chord, sevenths, pcs)}
              className={cx(
                'inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm transition-colors select-none',
                active
                  ? 'bg-chord text-chord-ink'
                  : 'text-ink ring-1 ring-inset ring-line hover:bg-surface'
              )}
            >
              <span className={cx('text-xs font-semibold', active ? 'text-chord-ink/80' : 'text-ink-3')}>
                {roman}
              </span>
              <span className="font-semibold">{pretty(name)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChordStrip;
