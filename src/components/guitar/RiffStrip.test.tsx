import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RiffStrip from '@/components/guitar/RiffStrip';
import { setFormState, useFormStore } from '@/store';

describe('RiffStrip', () => {
  beforeEach(() => {
    setFormState({ scale: 'blues', selectedRiffId: null, selectedPosition: null, bpm: 300 });
  });

  it('renders the riffs of the current scale', () => {
    render(<RiffStrip />);
    const group = screen.getByRole('group', { name: /demo riffs/i });
    expect(group.textContent).toContain('Slow-bend lick');
    expect(group.textContent).toContain('Shuffle riff');
  });

  it('selecting a riff adopts its tempo and clears the position', () => {
    setFormState({ selectedPosition: 2 });
    render(<RiffStrip />);
    fireEvent.click(screen.getByRole('button', { name: /Shuffle riff/ }));
    const state = useFormStore.getState();
    expect(state.selectedRiffId).toBe('blues-shuffle');
    expect(state.bpm).toBe(260);
    expect(state.selectedPosition).toBeNull();
  });

  it('clicking the active riff deselects it without touching the tempo', () => {
    render(<RiffStrip />);
    const button = screen.getByRole('button', { name: /Slow-bend lick/ });
    fireEvent.click(button);
    expect(useFormStore.getState().selectedRiffId).toBe('blues-slow-bend');
    fireEvent.click(button);
    const state = useFormStore.getState();
    expect(state.selectedRiffId).toBeNull();
    expect(state.bpm).toBe(200); // the adopted tempo stays
  });

  it('marks the active riff as pressed', () => {
    setFormState({ selectedRiffId: 'blues-shuffle' });
    render(<RiffStrip />);
    expect(screen.getByRole('button', { name: /Shuffle riff/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: /Slow-bend lick/ })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });
});
