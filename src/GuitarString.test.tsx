import React from 'react';
import { render, screen } from '@testing-library/react';
import GuitarString from './GuitarString';
import { scales } from './constants';

describe('GuitarString highlighting', () => {
  const baseProps = {
    idx: 0,
    note: 0, // E4
    frets: 1,
    scales,
    scale: 'blues' as keyof typeof scales,
    keyy: 'e',
  };

  it('shows octave overlay when enabled', () => {
    render(<GuitarString {...baseProps} highlightEnabled={true} octaveHighlight={true} playingAbs={5} />); // same octave as E4
    const e4 = screen.getByText(/E4/i);
    const overlay = e4.parentElement?.querySelector('.note-fade-overlay');
    expect(overlay).toBeInTheDocument();
  });

  it('does not highlight when disabled', () => {
    render(<GuitarString {...baseProps} highlightEnabled={false} playingAbs={5} />);
    const e4 = screen.getByText(/E4/i);
    const overlay = e4.parentElement?.querySelector('.note-fade-overlay');
    expect(overlay).toBeNull();
  });
});
