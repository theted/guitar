import { fretWeight, inlayAt, neckColumns } from './geometry';

describe('neck geometry', () => {
  it('narrows the frets towards the body, halving every 24', () => {
    expect(fretWeight(1)).toBe(1);
    expect(fretWeight(25)).toBeCloseTo(0.5);
    expect(fretWeight(13)).toBeLessThan(fretWeight(12));
  });

  it('has one column for the open strings plus one per fret', () => {
    expect(neckColumns(24).split(' minmax').length).toBe(25);
    expect(neckColumns(1).startsWith('44px ')).toBe(true);
  });

  it('places inlays like a real neck', () => {
    expect([0, 1, 3, 5, 7, 9, 12, 15, 24].map(inlayAt)).toEqual([0, 0, 1, 1, 1, 1, 2, 1, 2]);
  });
});
