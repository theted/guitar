import { renderPluck, type PluckConfig } from './pluck';

const RATE = 48000;
const GUITAR: PluckConfig = { brightness: 0.7, sustain: 3, pickPosition: 0.18, length: 1.5 };

// Seeded noise so renders are repeatable
const seeded = (seed = 7) => () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

// Fundamental by autocorrelation over the settled part of the note
const pitchOf = (samples: Float32Array, minHz = 40, maxHz = 1500): number => {
  const from = Math.floor(RATE * 0.1);
  const window = Math.floor(RATE * 0.2);
  let bestLag = 0;
  let best = -Infinity;
  for (let lag = Math.floor(RATE / maxHz); lag <= Math.ceil(RATE / minHz); lag += 1) {
    let sum = 0;
    for (let i = from; i < from + window; i += 1) sum += samples[i] * samples[i + lag];
    if (sum > best) { best = sum; bestLag = lag; }
  }
  // Parabolic interpolation around the peak for sub-sample accuracy
  const corr = (lag: number) => {
    let sum = 0;
    for (let i = from; i < from + window; i += 1) sum += samples[i] * samples[i + lag];
    return sum;
  };
  const [a, b, c] = [corr(bestLag - 1), corr(bestLag), corr(bestLag + 1)];
  const shift = (a - c) / (2 * (a - 2 * b + c));
  return RATE / (bestLag + shift);
};

const rms = (samples: Float32Array, fromSec: number, toSec: number) => {
  let sum = 0;
  const from = Math.floor(fromSec * RATE);
  const to = Math.floor(toSec * RATE);
  for (let i = from; i < to; i += 1) sum += samples[i] * samples[i];
  return Math.sqrt(sum / (to - from));
};

const cents = (actual: number, expected: number) => 1200 * Math.log2(actual / expected);

describe('renderPluck', () => {
  it.each([82.41, 110, 196, 329.63, 659.26, 1318.51])('rings in tune at %s Hz', (hz) => {
    const samples = renderPluck(RATE, hz, GUITAR, seeded());
    expect(Math.abs(cents(pitchOf(samples), hz))).toBeLessThan(5);
  });

  it('fades out like a string, faster for higher notes', () => {
    const low = renderPluck(RATE, 82.41, GUITAR, seeded());
    const high = renderPluck(RATE, 659.26, GUITAR, seeded());
    expect(rms(low, 1.0, 1.2)).toBeLessThan(rms(low, 0.05, 0.25));
    const fade = (s: Float32Array) => rms(s, 1.0, 1.2) / rms(s, 0.05, 0.25);
    expect(fade(high)).toBeLessThan(fade(low));
  });

  it('is normalised and finite', () => {
    const samples = renderPluck(RATE, 146.83, GUITAR, seeded());
    expect(samples).toHaveLength(RATE * 1.5);
    let peak = 0;
    for (const s of samples) {
      expect(Number.isFinite(s)).toBe(true);
      peak = Math.max(peak, Math.abs(s));
    }
    expect(peak).toBeCloseTo(0.85, 5);
  });

  it('sounds darker with a softer pluck', () => {
    // Treble energy: mean absolute difference between neighbouring samples
    const edge = (s: Float32Array) => {
      let sum = 0;
      for (let i = 1; i < 4800; i += 1) sum += Math.abs(s[i] - s[i - 1]);
      return sum;
    };
    const bright = renderPluck(RATE, 196, { ...GUITAR, brightness: 0.9 }, seeded());
    const dark = renderPluck(RATE, 196, { ...GUITAR, brightness: 0.2 }, seeded());
    expect(edge(dark)).toBeLessThan(edge(bright));
  });
});
