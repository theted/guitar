import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChordStrip from '@/components/guitar/ChordStrip';
import { setFormState, useFormStore } from '@/store';

describe('ChordStrip', () => {
  beforeEach(() => {
    setFormState({ scale: 'major', tone: 'c', selectedChordDegree: null });
  });

  it('renders the seven diatonic chords of C major', () => {
    render(<ChordStrip />);
    const group = screen.getByRole('group', { name: /diatonic chords/i });
    const buttons = group.querySelectorAll('button');
    expect(buttons).toHaveLength(7);
    expect(group.textContent).toContain('Dm');
    expect(group.textContent).toContain('Bdim');
  });

  it('toggles chord selection in the store', () => {
    render(<ChordStrip />);
    const fifth = screen.getByRole('button', { name: /V G/ });
    fireEvent.click(fifth);
    expect(useFormStore.getState().selectedChordDegree).toBe(5);
    fireEvent.click(fifth);
    expect(useFormStore.getState().selectedChordDegree).toBeNull();
  });

  it('renders nothing for non-heptatonic scales', () => {
    setFormState({ scale: 'pentatonic' });
    render(<ChordStrip />);
    expect(screen.queryByRole('group', { name: /diatonic chords/i })).not.toBeInTheDocument();
  });

  it('spells chords with the key signature (F major has Bb)', () => {
    setFormState({ tone: 'f' });
    render(<ChordStrip />);
    const group = screen.getByRole('group', { name: /diatonic chords/i });
    expect(group.textContent).toContain('Bb');
    expect(group.textContent).not.toContain('A#');
  });
});
