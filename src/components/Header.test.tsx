import { render, screen, fireEvent } from '@testing-library/react';
import Header from '@/components/Header';
import { setFormState, useFormStore } from '@/store';
import { StopPlaybackContext } from '@/hooks/useApplySetting';

const renderHeader = (stop: () => void = () => {}) =>
  render(
    <StopPlaybackContext.Provider value={stop}>
      <Header onOpenSettings={() => {}} />
    </StopPlaybackContext.Provider>
  );

describe('Header', () => {
  beforeEach(() => {
    setFormState({ scale: 'major', tone: 'e' });
  });

  it('lists all twelve keys chromatically from C, with real accidentals', () => {
    renderHeader();
    const keys = screen.getByRole('radiogroup', { name: 'Key' });
    expect(Array.from(keys.querySelectorAll('button')).map((b) => b.textContent)).toEqual([
      'C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B',
    ]);
  });

  it('changes key in one click and stops what is playing', () => {
    const stop = vi.fn();
    renderHeader(stop);
    fireEvent.click(screen.getByRole('radio', { name: 'B♭' }));
    expect(useFormStore.getState().tone).toBe('bb');
    expect(stop).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('radio', { name: 'B♭' })).toHaveAttribute('aria-checked', 'true');
  });

  it('titles the page with the key and scale', () => {
    renderHeader();
    const title = screen.getByRole('heading', { level: 1 });
    expect(title.textContent).toContain('E');
    expect(screen.getByRole('combobox', { name: 'Scale' })).toHaveTextContent('Major');
  });
});
