import { getScalePitchClasses, keyToOffset } from './music';
import { scales } from './constants';

// tones[] is E-rooted: [e,f,f#,g,g#,a,a#,b,c,c#,d,d#] (index 0 = E)
describe('keyToOffset', () => {
  it('maps note names to chromatic offsets from E', () => {
    expect(keyToOffset('e')).toBe(0);
    expect(keyToOffset('a')).toBe(5);
    expect(keyToOffset('c')).toBe(8);
    expect(keyToOffset('b')).toBe(7);
  });
});

describe('getScalePitchClasses', () => {
  it('produces the correct pitch classes for major scale', () => {
    expect(getScalePitchClasses(scales.major)).toEqual([0, 2, 4, 5, 7, 9, 11]);
  });

  it('produces the correct pitch classes for minor scale', () => {
    expect(getScalePitchClasses(scales.minor)).toEqual([0, 2, 3, 5, 7, 8, 10]);
  });

  it('produces 12 pitch classes for chromatic scale', () => {
    const pcs = getScalePitchClasses(scales.chromatic);
    expect(pcs.length).toBe(12);
    expect(pcs[0]).toBe(0);
    expect(pcs[11]).toBe(11);
  });

  it('returns [0] for empty scale', () => {
    expect(getScalePitchClasses([])).toEqual([0]);
  });
});

// Exact pitch-class spec for every scale in the catalog. Derived by hand from
// the interval definitions; guards against accidental edits to scales.ts.
describe('scale pitch-class spec table', () => {
  const expected: Record<keyof typeof scales, number[]> = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    pentatonic: [0, 3, 5, 7, 10],
    'pentatonic major': [0, 2, 4, 7, 9],
    blues: [0, 3, 5, 6, 7, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    locrian: [0, 1, 3, 5, 6, 8, 10],
    'harmonic minor': [0, 2, 3, 5, 7, 8, 11],
    'harmonic major': [0, 2, 4, 5, 7, 8, 11],
    arabian: [0, 2, 4, 5, 6, 8, 10],
    persian: [0, 1, 4, 5, 6, 8, 11],
    'double harmonic': [0, 1, 4, 5, 7, 8, 11],
    hungarian: [0, 2, 3, 6, 7, 8, 11],
    spanish: [0, 1, 4, 5, 7, 8, 10],
    japanese: [0, 1, 5, 7, 8],
    hirajoshi: [0, 2, 3, 7, 8],
    'whole tone': [0, 2, 4, 6, 8, 10],
    diminished: [0, 1, 3, 4, 6, 7, 9, 10],
    chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    'minor thirds': [0, 3, 6, 9],
    'major thirds': [0, 4, 8],
  };

  it('covers every scale in the catalog', () => {
    expect(Object.keys(expected).sort()).toEqual(Object.keys(scales).sort());
  });

  for (const [name, pcs] of Object.entries(expected)) {
    it(`computes ${name}`, () => {
      expect(getScalePitchClasses(scales[name as keyof typeof scales])).toEqual(pcs);
    });
  }
});
