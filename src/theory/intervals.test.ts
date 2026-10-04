import { degreeNames } from './intervals';
import { getScalePitchClasses } from '@/music';
import { scales, type ScaleName } from '@/constants';

const names = (scale: ScaleName) => degreeNames(getScalePitchClasses(scales[scale]));

describe('degreeNames', () => {
  it.each<[ScaleName, string]>([
    ['major', '1 2 3 4 5 6 7'],
    ['minor', '1 2 ♭3 4 5 ♭6 ♭7'],
    ['pentatonic', '1 ♭3 4 5 ♭7'],
    ['pentatonic major', '1 2 3 5 6'],
    ['blues', '1 ♭3 4 ♭5 5 ♭7'],
    ['lydian', '1 2 3 ♯4 5 6 7'],
    ['locrian', '1 ♭2 ♭3 4 ♭5 ♭6 ♭7'],
    ['hungarian', '1 2 ♭3 ♯4 5 ♭6 7'],
    ['whole tone', '1 2 3 ♯4 ♯5 ♭7'],
    ['major thirds', '1 3 ♯5'],
    ['minor thirds', '1 ♭3 ♭5 6'],
    ['hirajoshi', '1 2 ♭3 5 ♭6'],
    // Eight notes: two on the 3rd's letter, as jazz reads the half-whole scale
    ['diminished', '1 ♭2 ♭3 3 ♯4 5 6 ♭7'],
    // Key-independent default; getDegreeNames reads it per key
    ['chromatic', '1 ♭2 2 ♭3 3 4 ♭5 5 ♭6 6 ♭7 7'],
  ])('reads %s as %s', (scale, expected) => {
    expect(names(scale).join(' ')).toBe(expected);
  });
});
