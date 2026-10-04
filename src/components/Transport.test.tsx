import { render, screen, fireEvent } from '@testing-library/react';
import Transport from '@/components/Transport';
import { setFormState, useFormStore } from '@/store';

const renderTransport = () => render(<Transport isPlaying={false} onTogglePlay={() => {}} />);

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
