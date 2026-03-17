import { getOctaveIndex, getNoteWithOctave, getScalePitchClasses, getDegreeInScale, keyToOffset, getNote } from './music';
import { scales } from './constants';

describe('getOctaveIndex', () => {
  it('computes octave index relative to E4 base', () => {
    expect(getOctaveIndex(0)).toBe(4);   // E4
    expect(getOctaveIndex(8)).toBe(5);   // C5
    expect(getOctaveIndex(12)).toBe(5);  // E5
    expect(getOctaveIndex(-12)).toBe(3); // E3
  });
});

describe('getNoteWithOctave', () => {
  it('formats note with octave', () => {
    expect(getNoteWithOctave(-36)).toBe('E1');
    expect(getNoteWithOctave(-12)).toBe('E3');
    expect(getNoteWithOctave(0)).toBe('E4');
    expect(getNoteWithOctave(1)).toBe('F4');
    expect(getNoteWithOctave(8)).toBe('C5');
    expect(getNoteWithOctave(-1)).toBe('D#4');
  });
});

// tones[] is E-rooted: [e,f,f#,g,g#,a,a#,b,c,c#,d,d#] (index 0 = E)
describe('keyToOffset', () => {
  it('maps note names to chromatic offsets from E', () => {
    expect(keyToOffset('e')).toBe(0);
    expect(keyToOffset('a')).toBe(5);
    expect(keyToOffset('c')).toBe(8);
    expect(keyToOffset('b')).toBe(7);
  });
});

describe('getNote', () => {
  it('returns notes by index into the E-rooted tones array', () => {
    expect(getNote(0)).toBe('e');
    expect(getNote(5)).toBe('a');
    expect(getNote(12)).toBe('e');  // wraps after 12
    expect(getNote(-1)).toBe('d#'); // wraps negative
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

describe('getDegreeInScale', () => {
  it('returns 1-based degree for notes in the scale', () => {
    // C major, key = C (offset 0), abs note = 0 → pitch class 0 → degree 1
    expect(getDegreeInScale(0, 0, scales.major)).toBe(1);
    // C major, abs note = 2 → pitch class 2 → degree 2 (D)
    expect(getDegreeInScale(2, 0, scales.major)).toBe(2);
    // C major, abs note = 11 → pitch class 11 → degree 7 (B)
    expect(getDegreeInScale(11, 0, scales.major)).toBe(7);
  });

  it('returns null for notes outside the scale', () => {
    // C major, abs note = 1 → pitch class 1 (C#) → not in major scale
    expect(getDegreeInScale(1, 0, scales.major)).toBeNull();
  });

  it('accounts for key offset', () => {
    // A major: keyOffset = 5 (A is at index 5 in E-rooted tones)
    // abs=5 → pc = (5-5)%12 = 0 → degree 1 (A = root)
    const aOffset = keyToOffset('a');
    expect(getDegreeInScale(5, aOffset, scales.major)).toBe(1);
    // B is degree 2 in A major: abs=7 → pc=(7-5)%12=2 → index 1 → degree 2
    expect(getDegreeInScale(7, aOffset, scales.major)).toBe(2);
  });

  it('wraps across octaves', () => {
    // C major, abs note = 12 → pitch class 0 (C one octave up) → degree 1
    expect(getDegreeInScale(12, 0, scales.major)).toBe(1);
    expect(getDegreeInScale(-12, 0, scales.major)).toBe(1);
  });
});
