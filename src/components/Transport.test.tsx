import { render, screen, fireEvent } from '@testing-library/react';
import Transport from '@/components/Transport';
import { setFormState, useFormStore } from '@/store';

const renderTransport = () => render(<Transport isPlaying={false} onTogglePlay={() => {}} />);

describe('Transport octaves', () => {
  it('marks octaves that do not fit on the neck, and shows what will play', () => {
    setFormState({ selectedPosition: null, phraseOctaves: 5 });
    render(<Transport isPlaying={false} onTogglePlay={() => {}} maxOctaves={3} />);
    const group = screen.getByRole('radiogroup', { name: 'Octaves' });
    const options = Array.from(group.querySelectorAll('button'));
    expect(options.map((b) => b.disabled)).toEqual([false, false, false, true, true]);
    expect(options[2]).toHaveAttribute('aria-checked', 'true');
  });
});

describe('Transport while practising a position', () => {
  beforeEach(() => {
    setFormState({ scale: 'pentatonic', tone: 'a', tuningName: 'Standard', strings: 6, frets: 24, startOctave: 4, positionSpan: 5, selectedPosition: null });
  });

  it('offers patterns and octaves when no position is selected', () => {
    renderTransport();
    expect(screen.getByRole('combobox', { name: 'Pattern' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Octaves' })).toBeInTheDocument();
  });

  it('hides them for a position, and says which one is playing', () => {
    setFormState({ selectedPosition: 2 });
    renderTransport();
    expect(screen.queryByRole('combobox', { name: 'Pattern' })).not.toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: 'Octaves' })).not.toBeInTheDocument();
    expect(screen.getByText('Position 2')).toBeInTheDocument();
    expect(screen.getByText(/frets \d+–\d+/)).toBeInTheDocument();
    // Descend and loop still shape how the box is played
    expect(screen.getByRole('button', { name: 'Descend' })).toBeInTheDocument();
  });

  it('goes back to patterns in one click', () => {
    setFormState({ selectedPosition: 2 });
    renderTransport();
    fireEvent.click(screen.getByRole('button', { name: /play patterns/i }));
    expect(useFormStore.getState().selectedPosition).toBeNull();
    expect(screen.getByRole('combobox', { name: 'Pattern' })).toBeInTheDocument();
  });
});
