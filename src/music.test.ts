import { getOctaveIndex, getNoteWithOctave } from './music';

describe('music octave helpers', () => {
  it('computes octave index relative to E4 base', () => {
    expect(getOctaveIndex(0)).toBe(4); // E4 scientific
    expect(getOctaveIndex(8)).toBe(5); // C5 scientific
    expect(getOctaveIndex(12)).toBe(5); // E5 scientific
    expect(getOctaveIndex(-12)).toBe(3); // E3 scientific
  });

  it('formats note with octave (E1 -> 1)', () => {
    expect(getNoteWithOctave(-36)).toBe('E1');
    expect(getNoteWithOctave(-12)).toBe('E3');
    expect(getNoteWithOctave(0)).toBe('E4');
    expect(getNoteWithOctave(1)).toBe('F4');
    expect(getNoteWithOctave(8)).toBe('C5');
    expect(getNoteWithOctave(-1)).toBe('D#4');
  });
});
