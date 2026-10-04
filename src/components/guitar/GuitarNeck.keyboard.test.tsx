import { render, fireEvent } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import GuitarNeck from '@/components/guitar/GuitarNeck';
import { useRenderedStrings } from '@/components/guitar/hooks/useRenderedStrings';
import { setFormState } from '@/store';

vi.mock('@/audio', async (original) => ({
  ...(await original<typeof import('@/audio')>()),
  ensureAudioInitialized: vi.fn(async () => {}),
}));
vi.mock('@/scheduler', () => ({ scheduler: { triggerNow: vi.fn() } }));
import { scheduler } from '@/scheduler';

// Standard tuning, low string first
const STANDARD = [-24, -19, -14, -9, -5, 0];

const renderNeck = () => {
  setFormState({ scale: 'major', tone: 'g', highlightEnabled: true, singleStringScale: false, selectedChordDegree: null, selectedPosition: null });
  const { result } = renderHook(() => useRenderedStrings({ baseNotes: STANDARD, lowAtBottom: true }));
  return render(<GuitarNeck descriptors={result.current.descriptors} frets={12} />);
};

const tabStops = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('[role="gridcell"][tabindex="0"]'));

describe('GuitarNeck keyboard', () => {
  beforeEach(() => vi.mocked(scheduler.triggerNow).mockClear());

  it('is one tab stop, starting on the tonic of the lowest string', () => {
    const { container, getByRole } = renderNeck();
    expect(getByRole('grid', { name: /fretboard/i })).toBeInTheDocument();
    const stops = tabStops(container);
    expect(stops).toHaveLength(1);
    // G on the low E string is the 3rd fret
    expect(stops[0].dataset.string).toBe('0');
    expect(stops[0].dataset.fret).toBe('3');
    expect(stops[0].getAttribute('aria-label')).toBe('G2, root, fret 3');
  });

  it('moves with the arrows and takes the tab stop along', () => {
    const { container } = renderNeck();
    const start = tabStops(container)[0];
    start.focus();
    fireEvent.keyDown(start, { key: 'ArrowRight' });
    expect(document.activeElement?.getAttribute('data-fret')).toBe('4');
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' });
    // Up from the low E is the A string, drawn above it
    expect(document.activeElement?.getAttribute('data-string')).toBe('1');
    expect(tabStops(container)).toEqual([document.activeElement]);
  });

  it('plays the note under the cursor with Enter, Space, or Shift + arrow', () => {
    const { container } = renderNeck();
    const start = tabStops(container)[0];
    start.focus();
    fireEvent.keyDown(start, { key: 'Enter' });
    fireEvent.keyDown(start, { key: ' ' });
    fireEvent.keyDown(start, { key: 'ArrowRight', shiftKey: true });
    // Plain arrows only move
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
    return Promise.resolve().then(() => {
      expect(scheduler.triggerNow).toHaveBeenCalledTimes(3);
    });
  });

  it('makes a clicked fret the tab stop', () => {
    const { container } = renderNeck();
    const cell = container.querySelector<HTMLElement>('[data-string="4"][data-fret="8"]')!;
    fireEvent.focus(cell);
    expect(tabStops(container)).toEqual([cell]);
  });
});
