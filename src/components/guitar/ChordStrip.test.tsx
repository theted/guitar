import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChordStrip from '@/components/guitar/ChordStrip';
import { setFormState, useFormStore } from '@/store';

describe('ChordStrip', () => {
  beforeEach(() => {
    setFormState({ scale: 'major', tone: 'c', selectedChordDegree: null, chordSevenths: false });
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

  it('names 7th chords, with their notes and intervals, under 7ths', () => {
    render(<ChordStrip />);
    fireEvent.click(screen.getByRole('radio', { name: '7ths' }));
    expect(useFormStore.getState().chordSevenths).toBe(true);
    const group = screen.getByRole('group', { name: /diatonic chords/i });
    expect(Array.from(group.querySelectorAll('button')).map((button) => button.textContent)).toEqual([
      'Imaj7Cmaj7', 'ii7Dm7', 'iii7Em7', 'IVmaj7Fmaj7', 'V7G7', 'vi7Am7', 'viiø7Bm7♭5',
    ]);
    expect(screen.getByRole('button', { name: /ii7 Dm7/ })).toHaveAttribute('title', 'Dm7: D F A C (R ♭3 5 ♭7)');
  });

  it('sounds a chord as it is picked, not as it is let go', () => {
    const strum = vi.fn();
    render(<ChordStrip onStrumChord={strum} />);
    const fifth = screen.getByRole('button', { name: /V G/ });
    fireEvent.click(fifth);
    expect(strum).toHaveBeenCalledWith(5);
    fireEvent.click(fifth);
    expect(strum).toHaveBeenCalledTimes(1);
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
    expect(group.textContent).toContain('B♭');
    expect(group.textContent).not.toMatch(/A[#♯]/);
  });
});
