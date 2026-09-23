import React from 'react';
import { render, screen } from '@testing-library/react';
import GuitarString from '@/components/guitar/GuitarString';
import { scales } from '@/constants';

// Every fret is titled with its full name and interval, e.g. "B♭4 (P4)"
const fret = (name: string) => screen.getByTitle(new RegExp(`^${name} `));

describe('GuitarString highlighting', () => {
  const baseProps = {
    stringIndex: 0,
    note: 0, // E4
    frets: 2,
    scales,
    scale: 'blues' as keyof typeof scales,
    keyy: 'e',
  };

  it('gives every fret a tone overlay for playback flashes', () => {
    render(<GuitarString {...baseProps} />);
    expect(fret('E4').querySelector('.tone-overlay')).toBeInTheDocument();
    expect(fret('F♯4').querySelector('.tone-overlay')).toBeInTheDocument();
  });

  it('marks the tonic, the other scale tones and the rest differently', () => {
    render(<GuitarString {...baseProps} note={-2} frets={3} />);
    // D (m7) · D# (off) · E (root) · F (off)
    expect(fret('D4')).toHaveAttribute('data-state', 'scale');
    expect(fret('D♯4')).toHaveAttribute('data-state', 'off');
    expect(fret('E4')).toHaveAttribute('data-state', 'root');
    expect(fret('F4')).toHaveAttribute('data-state', 'off');
  });

  it('shows nothing but notes-to-find when the scale is hidden', () => {
    render(<GuitarString {...baseProps} highlightEnabled={false} />);
    expect(fret('E4')).toHaveAttribute('data-state', 'off');
  });

  it('labels scale tones by note, degree or interval', () => {
    const { rerender } = render(<GuitarString {...baseProps} note={3} frets={0} />); // G4, the m3 of E
    expect(fret('G4').textContent).toBe('G');
    rerender(<GuitarString {...baseProps} note={3} frets={0} labelMode="degree" />);
    expect(fret('G4').textContent).toBe('2');
    rerender(<GuitarString {...baseProps} note={3} frets={0} labelMode="interval" />);
    expect(fret('G4').textContent).toBe('m3');
  });

  it('highlights a selected chord and steps the rest of the scale back', () => {
    // E major, IV chord = A C# E; open A string: A (root) A# (off) B (scale)
    render(<GuitarString {...baseProps} scale="major" note={5} frets={2} selectedChordDegree={4} />);
    expect(fret('A4')).toHaveAttribute('data-state', 'chord-root');
    expect(fret('A♯4')).toHaveAttribute('data-state', 'off');
    expect(fret('B4')).toHaveAttribute('data-state', 'muted');
  });

  it('flags frets outside the practised position', () => {
    render(<GuitarString {...baseProps} positionFrets={new Set([1, 2])} />);
    expect(fret('E4')).toHaveAttribute('data-outside');
    expect(fret('F♯4')).not.toHaveAttribute('data-outside');
  });
});

describe('GuitarString enharmonic spelling', () => {
  it('spells the fourth of F major as B♭, not A♯', () => {
    // Open A string (A4 = abs 5), fret 1 sounds Bb4
    render(
      <GuitarString
        stringIndex={0}
        note={5}
        frets={1}
        scales={scales}
        scale="major"
        keyy="f"
      />
    );
    expect(fret('B♭4')).toHaveTextContent('B♭');
    expect(screen.queryByTitle(/^A♯4/)).not.toBeInTheDocument();
  });

  it('spells non-scale chromatic notes plainly in sharp keys', () => {
    // Fret 1 on the open E string sounds F natural — outside E major, spelled F
    render(
      <GuitarString
        stringIndex={0}
        note={0}
        frets={1}
        scales={scales}
        scale="major"
        keyy="e"
      />
    );
    expect(fret('F4')).toHaveTextContent('F');
  });
});
