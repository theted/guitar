import { render, screen, fireEvent } from '@testing-library/react';
import Header from '@/components/Header';
import { setFormState, useFormStore } from '@/store';

const renderHeader = () => render(<Header onOpenSettings={() => {}} />);

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

  it('changes key in one click', () => {
    renderHeader();
    fireEvent.click(screen.getByRole('radio', { name: 'B♭' }));
    expect(useFormStore.getState().tone).toBe('bb');
    expect(screen.getByRole('radio', { name: 'B♭' })).toHaveAttribute('aria-checked', 'true');
  });

  it('titles the page with the key and scale', () => {
    renderHeader();
    const title = screen.getByRole('heading', { level: 1 });
    expect(title.textContent).toContain('E');
    expect(screen.getByRole('combobox', { name: 'Scale' })).toHaveTextContent('Major');
  });
});

describe('Header title', () => {
  it('names the scale the way it is written (D♭ minor reads as C♯ minor)', () => {
    setFormState({ tone: 'db', scale: 'minor' });
    render(<Header onOpenSettings={() => {}} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('C♯');
    // The key row still shows the key that was picked
    expect(screen.getByRole('radio', { name: 'D♭' })).toHaveAttribute('aria-checked', 'true');
  });
});
