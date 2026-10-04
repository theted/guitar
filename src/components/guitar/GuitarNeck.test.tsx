import { render } from '@testing-library/react';
import GuitarNeck from '@/components/guitar/GuitarNeck';
import { useRenderedStrings } from '@/components/guitar/hooks/useRenderedStrings';
import { setFormState } from '@/store';
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
