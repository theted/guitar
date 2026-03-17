import { describe, it, expect } from 'vitest';
import { semitoneToFrequency } from './synthesis';

// The anchor: semitone 5 from E (= A4) maps to 440 Hz.
// Formula: 440 * 2^((n - 5) / 12)
describe('semitoneToFrequency', () => {
  it('returns 440 Hz for A4 (semitone 5 from E)', () => {
    expect(semitoneToFrequency(5)).toBeCloseTo(440, 2);
  });

  it('returns an octave up for +12 semitones', () => {
    expect(semitoneToFrequency(17)).toBeCloseTo(880, 2); // A5
  });

  it('returns an octave down for -12 semitones', () => {
    expect(semitoneToFrequency(-7)).toBeCloseTo(220, 2); // A3
  });

  it('returns ~329.63 Hz for E4 (semitone 0)', () => {
    expect(semitoneToFrequency(0)).toBeCloseTo(329.63, 1);
  });

  it('each semitone step multiplies frequency by the 12th root of 2', () => {
    const ratio = semitoneToFrequency(6) / semitoneToFrequency(5);
    expect(ratio).toBeCloseTo(Math.pow(2, 1 / 12), 6);
  });
});
