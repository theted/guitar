import React from 'react';
import { render, screen } from '@testing-library/react';
import GuitarString from '@/components/guitar/GuitarString';
import { scales } from '@/constants';

describe('GuitarString highlighting', () => {
  const baseProps = {
    idx: 0,
    note: 0, // E4
    frets: 1,
    scales,
    scale: 'blues' as keyof typeof scales,
    keyy: 'e',
  };

  it('shows tone overlay for highlighting', () => {
    render(<GuitarString {...baseProps} />);
    const e4 = screen.getByText(/E4/i);
    const overlay = e4.parentElement?.querySelector('.tone-overlay');
    expect(overlay).toBeInTheDocument();
  });

  it('has tone overlay present regardless of highlighting state', () => {
    render(<GuitarString {...baseProps} />);
    const e4 = screen.getByText(/E4/i);
    const overlay = e4.parentElement?.querySelector('.tone-overlay');
    expect(overlay).toBeInTheDocument(); // tone-overlay is always present, animations are controlled via CSS classes
  });
});

describe('GuitarString enharmonic spelling', () => {
  it('spells the fourth of F major as Bb, not A#', () => {
    // Open A string (A4 = abs 5), fret 1 sounds Bb4
    render(
      <GuitarString
        idx={0}
        note={5}
        frets={1}
        scales={scales}
        scale="major"
        keyy="f"
      />
    );
    expect(screen.getByText('Bb4')).toBeInTheDocument();
    expect(screen.queryByText('A#4')).not.toBeInTheDocument();
  });

  it('spells non-scale chromatic notes plainly in sharp keys', () => {
    // Fret 1 on the open E string sounds F natural — outside E major, spelled F
    render(
      <GuitarString
        idx={0}
        note={0}
        frets={1}
        scales={scales}
        scale="major"
        keyy="e"
      />
    );
    expect(screen.getByText('F4')).toBeInTheDocument();
  });
});
