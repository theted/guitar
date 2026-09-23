// Fret spacing for the on-screen neck. A real neck halves its fret width every
// twelve frets; that makes the upper frets too small to click, so the curve is
// flattened to halve every 24 — it still reads as a guitar, and fret 24 stays
// a comfortable target.
export const fretWeight = (fret: number): number => Math.pow(2, -(fret - 1) / 24);

const OPEN_LANE_PX = 44;
const minFretPx = (fret: number): number => Math.round(26 + 28 * fretWeight(fret));

/** CSS grid columns: the open-string lane, then one column per fret */
export const neckColumns = (frets: number): string => {
  const columns = [`${OPEN_LANE_PX}px`];
  for (let fret = 1; fret <= frets; fret += 1) {
    columns.push(`minmax(${minFretPx(fret)}px, ${fretWeight(fret).toFixed(4)}fr)`);
  }
  return columns.join(" ");
};

/** Narrowest the neck may get before it scrolls instead */
export const neckMinWidth = (frets: number): number => {
  let width = OPEN_LANE_PX;
  for (let fret = 1; fret <= frets; fret += 1) width += minFretPx(fret);
  return width;
};

/** Inlay dots: single at 3 5 7 9, double at 12, repeating every octave */
export const inlayAt = (fret: number): 0 | 1 | 2 => {
  if (fret === 0) return 0;
  const inOctave = fret % 12;
  if (inOctave === 0) return 2;
  return inOctave === 3 || inOctave === 5 || inOctave === 7 || inOctave === 9 ? 1 : 0;
};
