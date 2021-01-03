// scales are defined in half-tones from the last tone in the scale
export const scales = {
  minor: [2, 1, 2, 2, 1, 2, 2],
  major: [2, 2, 1, 2, 2, 2, 1],
  pentatonic: [3, 2, 2, 3, 2],
  blues: [3, 2, 1, 1, 3, 2],
  diminished: [3],
  test: [2],
  weird: [4],
  arabian: [2, 1, 2, 1, 2, 2, 15], // !
  persian: [1, 3, 1, 1, 2, 2],
  japanese: [1, 4, 2, 1],
  locrian: [1, 2, 2, 1, 2, 2, 2], // !
  'pentatonic major': [2, 2, 3, 2, 3],
  gypsy: [1, 3, 1, 2, 1, 3],
  lydian: [2, 2, 2, 1, 2],
  phrygian: [1, 3, 1, 2, 1, 3, 4], // !
  byzantine: [1, 3, 1, 2, 1, 2], // !
  chromatic: [1],
};

export const tones = [
  'e',
  'f',
  'f#',
  'g',
  'g#',
  'a',
  'a#',
  'b',
  'c',
  'c#',
  'd',
  'd#',
];

export const tunings = {
  Standard: ['e', 'a', 'd', 'g', 'b', 'e'],
  'Drop D': ['d', 'a', 'd', 'g', 'b', 'e'],
  'Open A': ['e', 'a', 'c#', 'e', 'a', 'e'],
  DADGAD: ['d', 'a', 'd', 'g', 'a', 'd'],
  DEAD: ['d', 'e', 'a'],
};

export const DEFAULTS = {
  STRINGS: 6,
  FRETS: 24,
  TUNING: tunings.Standard,
  SCALE: 'blues',
  KEY: 'e',
};
