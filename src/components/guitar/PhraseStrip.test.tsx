import { render, screen } from '@testing-library/react';
import PhraseStrip from '@/components/guitar/PhraseStrip';
import { toneAnimationManager } from '@/lib/tone-animation';
import { setFormState } from '@/store';
import type { PhraseEvent } from '@/components/guitar/hooks/usePhraseEvents';

const eventsFor = (...abs: number[]): PhraseEvent[] =>
  abs.map((value, index) => ({
    abs: value,
    startTimeSec: index * 0.2,
    durSec: 0.24,
    index,
  }));

describe('PhraseStrip', () => {
  beforeEach(() => {
    setFormState({ scale: 'major', tone: 'c' });
  });

  it('renders nothing when there is no phrase', () => {
    render(<PhraseStrip events={[]} />);
    expect(screen.queryByRole('group', { name: /phrase/i })).not.toBeInTheDocument();
  });

  it('labels every note of the phrase with its spelling and octave', () => {
    // C major from the C on the low E string (abs -16 = C3)
    render(<PhraseStrip events={eventsFor(-16, -14, -12, -11, -9)} />);
    const strip = screen.getByRole('group', { name: /phrase — 5 notes/i });
    expect(strip.textContent).toBe('C3D3E3F3G3');
  });

  it('uses the key signature rather than raw sharps', () => {
    setFormState({ tone: 'f' });
    render(<PhraseStrip events={eventsFor(-23, -21, -19, -18)} />);
    const strip = screen.getByRole('group', { name: /phrase/i });
    expect(strip.textContent).toContain('Bb');
    expect(strip.textContent).not.toContain('A#');
  });

  it('flashes each step by position, so a repeated pitch lights up once', () => {
    const animate = vi.fn(() => ({ cancel: vi.fn(), onfinish: null }));
    Element.prototype.animate = animate as unknown as typeof Element.prototype.animate;

    // The tonic appears twice — the octave repeat is a separate step
    render(<PhraseStrip events={eventsFor(-16, -14, -4)} />);
    toneAnimationManager.flashStep(2, 100);
    expect(animate).toHaveBeenCalledTimes(1);
  });
});
