import { render } from '@testing-library/react';
import GuitarNeck from '@/components/guitar/GuitarNeck';
import { useRenderedStrings } from '@/components/guitar/hooks/useRenderedStrings';
import { setFormState } from '@/store';
import type { PhraseEvent } from '@/components/guitar/hooks/usePhraseEvents';
import { renderHook } from '@testing-library/react';

// Standard tuning, low string first
const STANDARD = [-24, -19, -14, -9, -5, 0];

const markedRows = (lowAtBottom: boolean) => {
  setFormState({ scale: 'major', tone: 'e', singleStringScale: true, highlightEnabled: true, selectedChordDegree: null, selectedPosition: null });
  const { result } = renderHook(() => useRenderedStrings({ baseNotes: STANDARD, lowAtBottom }));
  const { container } = render(<GuitarNeck descriptors={result.current.descriptors} frets={2} />);
  return Array.from(container.querySelectorAll('.neck-string')).map(
    (row) => row.querySelectorAll('.fret:not([data-state="off"])').length > 0
  );
};

describe('GuitarNeck "lowest string only"', () => {
  it('marks the low E whether it is drawn at the bottom or the top', () => {
    // Rows are listed top to bottom as drawn
    expect(markedRows(true)).toEqual([false, false, false, false, false, true]);
    expect(markedRows(false)).toEqual([true, false, false, false, false, false]);
  });
});

describe('GuitarNeck fading what the phrase won\'t play', () => {
  // E F# G# on the low E string: frets 0, 2 and 4, back down from 4 to 2
  const events: PhraseEvent[] = [
    [-24, 0], [-22, 2], [-20, 4], [-22, 2],
  ].map(([abs, fret], index) => ({ abs, index, startTimeSec: index * 0.2, durSec: 0.2, stringIndex: 0, fret }));

  const playedOnLowE = (fadeUnplayed: boolean) => {
    setFormState({
      scale: 'major', tone: 'e', singleStringScale: false, highlightEnabled: true, selectedChordDegree: null,
      selectedPosition: null, tuningName: 'Standard', strings: 6, startOctave: 4, fadeUnplayed, flashMode: 'fret',
    });
    const { result } = renderHook(() => useRenderedStrings({ baseNotes: STANDARD, lowAtBottom: true }));
    const { container } = render(<GuitarNeck descriptors={result.current.descriptors} frets={5} events={events} />);
    // The low E is drawn last (at the bottom)
    const rows = container.querySelectorAll('.neck-string');
    return Array.from(rows[rows.length - 1].querySelectorAll('.fret')).map((fret) => fret.getAttribute('data-played'));
  };

  it('marks each fret by which way the phrase plays it', () => {
    expect(playedOnLowE(true)).toEqual(['up', 'none', 'both', 'none', 'both', 'none']);
  });

  it('marks nothing with the setting off', () => {
    expect(playedOnLowE(false)).toEqual([null, null, null, null, null, null]);
  });
});
