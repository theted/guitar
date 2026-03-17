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
