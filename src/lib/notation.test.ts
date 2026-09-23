import { pretty } from './notation';

describe('pretty', () => {
  it('uses real accidentals', () => {
    expect(pretty('Bb')).toBe('B♭');
    expect(pretty('F#4')).toBe('F♯4');
    expect(pretty('Cbb')).toBe('C♭♭');
  });

  it('leaves the letter B alone', () => {
    expect(pretty('B')).toBe('B');
    expect(pretty('Bb3')).toBe('B♭3');
    expect(pretty('Bdim')).toBe('Bdim');
  });
});
