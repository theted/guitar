import { PhraseMode } from './constants';
import type { PitchClass, AbsSemitone } from './types/music';

// Shared helper: degree sequence for the snake/motif-1232 overlapping-triplet pattern.
// Pattern: 1-2-3-2-3-4-3-4-5-...
const buildSnakeDegSeq = (n: number): number[] => {
  if (n >= 3) {
    const degs = [1, 2, 3, 2];
    for (let d = 3; d <= n - 1; d += 1) {
      degs.push(d, d + 1);
      if (d < n - 1) degs.push(d);
    }
    return degs;
  }
  return Array.from({ length: n }, (_, i) => i + 1);
};

// Full ascending degree sequence 1..n
const ascDegSeq = (n: number): number[] => Array.from({ length: n }, (_, i) => i + 1);

// Expand a single-octave semitone array across multiple octaves, with optional descent
const expandAcrossOctaves = (oneOct: number[], clampOct: number, desc: boolean): AbsSemitone[] => {
  const asc: number[] = [];
  for (let o = 0; o < clampOct; o += 1) asc.push(...oneOct.map((r) => r + o * 12));
  if (!desc) return asc as AbsSemitone[];
  const apex = oneOct.length > 0 ? clampOct * 12 + oneOct[0] : clampOct * 12;
  return [...asc, apex, ...asc.slice().reverse()] as AbsSemitone[];
};

// Each builder returns the single-octave semitone sequence for its phrase mode.
// buildRelSequence handles octave expansion for all of them.
type OctBuilder = (pcs: PitchClass[]) => number[];

const modeBuilders: Record<PhraseMode, OctBuilder> = {
  'full-scale': (pcs) => [...pcs],

  'snake':      (pcs) => buildSnakeDegSeq(pcs.length).map((d) => pcs[d - 1]),
  'motif-1232': (pcs) => buildSnakeDegSeq(pcs.length).map((d) => pcs[d - 1]),

  'snake-complex': (pcs) => {
    const pattern0 = [0, 3, 2, 1, 2, 3, 2, 1, 4, 3, 2, 3];
    const n = pcs.length;
    return pattern0.map((z) => pcs[(z % n + n) % n]);
  },

  'four-note-groups': (pcs) => {
    const n = pcs.length;
    const degs: number[] = [];
    if (n >= 4) {
      for (let s = 1; s <= n - 3; s += 1) degs.push(s, s + 1, s + 2, s + 3);
    } else {
      degs.push(...ascDegSeq(n));
    }
    return degs.map((d) => pcs[d - 1]);
  },

  'thirds': (pcs) => {
    const n = pcs.length;
    const degs: number[] = [];
    for (let s = 1; s + 2 <= n; s += 1) degs.push(s, s + 2);
    if (degs.length === 0) degs.push(...ascDegSeq(n));
    return degs.map((d) => pcs[d - 1]);
  },

  'fourths': (pcs) => {
    const n = pcs.length;
    const degs: number[] = [];
    for (let s = 1; s + 3 <= n; s += 1) degs.push(s, s + 3);
    if (degs.length === 0) degs.push(...ascDegSeq(n));
    return degs.map((d) => pcs[d - 1]);
  },

  'sixths': (pcs) => {
    const n = pcs.length;
    const degs: number[] = [];
    if (n >= 6) {
      for (let s = 1; s <= n; s += 1) degs.push(s, ((s + 4) % n) + 1);
    } else {
      for (let s = 1; s + 2 <= n; s += 1) degs.push(s, s + 2);
      if (degs.length === 0) degs.push(...ascDegSeq(n));
    }
    return degs.map((d) => pcs[d - 1]);
  },

  'triads': (pcs) => {
    const n = pcs.length;
    const degs: number[] = [];
    for (let s = 1; s + 4 <= n; s += 1) degs.push(s, s + 2, s + 4);
    if (degs.length === 0) degs.push(...ascDegSeq(n));
    return degs.map((d) => pcs[d - 1]);
  },

  'sevenths': (pcs) => {
    const n = pcs.length;
    const degs: number[] = [];
    for (let s = 1; s + 6 <= n; s += 1) degs.push(s, s + 2, s + 4, s + 6);
    if (degs.length === 0) {
      for (let s = 1; s + 4 <= n; s += 1) degs.push(s, s + 2, s + 4);
      if (degs.length === 0) degs.push(...ascDegSeq(n));
    }
    return degs.map((d) => pcs[d - 1]);
  },

  'alternate-picking': (pcs) => {
    const up = ascDegSeq(pcs.length);
    return [...up, ...up.slice().reverse()].map((d) => pcs[d - 1]);
  },

  'pedal-tone': (pcs) => {
    const degs: number[] = [1];
    for (let d = 2; d <= pcs.length; d += 1) degs.push(d, 1);
    return degs.map((d) => pcs[d - 1]);
  },

  'sequence-asc': (pcs) => {
    const n = pcs.length;
    const degs: number[] = [];
    for (let d = 1; d <= n - 2; d += 1) degs.push(d, d + 1, d + 2);
    return degs.map((d) => pcs[d - 1]);
  },

  'sequence-desc': (pcs) => {
    const n = pcs.length;
    const degs: number[] = [];
    for (let d = n; d >= 3; d -= 1) degs.push(d, d - 1, d - 2);
    return degs.map((d) => pcs[d - 1]);
  },

  'skip-pattern': (pcs) => {
    const n = pcs.length;
    const degs: number[] = [];
    for (let d = 1; d <= n - 1; d += 1) degs.push(d, d + 2 <= n ? d + 2 : d + 1);
    return degs.map((d) => pcs[d - 1]);
  },

  'sweep-arp': (pcs) => {
    const up: number[] = [];
    for (let d = 1; d <= pcs.length; d += 2) up.push(d);
    return [...up, ...up.slice(0, -1).reverse()].map((d) => pcs[d - 1]);
  },

  'neo-classical': (pcs) => {
    const n = pcs.length;
    const pattern = [1, 2, 4, 5];
    if (n >= 7) pattern.push(7);
    const degs: number[] = [];
    pattern.forEach((d) => { if (d <= n) degs.push(d); });
    if (n >= 8) degs.push(n);
    for (let i = pattern.length - 1; i >= 0; i -= 1) {
      if (pattern[i] <= n) degs.push(pattern[i]);
    }
    return degs.map((d) => pcs[d - 1]);
  },

  'power-chord': (pcs) => {
    const n = pcs.length;
    const fifth = n >= 5 ? 5 : n;
    const fourth = n >= 4 ? 4 : n;
    return [1, 1, fifth, fifth, 1, 1, fifth, fifth, fourth, fourth, 1, 1].map((d) => pcs[d - 1]);
  },

  'djent-palm': (pcs) => {
    const n = pcs.length;
    const degs: number[] = [1, 1, 1];
    if (n >= 6) degs.push(6);
    degs.push(1, 1);
    if (n >= 4) degs.push(4);
    degs.push(1, 1);
    if (n >= 5) degs.push(5);
    degs.push(1, 1);
    if (n >= 3) degs.push(3);
    return degs.map((d) => pcs[Math.min(d, n) - 1]);
  },

  'polyrhythm': (pcs) => {
    const n = pcs.length;
    const degs: number[] = [];
    for (let i = 0; i < 14; i += 1) degs.push(((i % 7) % n) + 1);
    return degs.map((d) => pcs[d - 1]);
  },

  'breakdown-chug': (pcs) => {
    const n = pcs.length;
    const degs: number[] = [1, 1, 1, 1];
    if (n >= 6) degs.push(6, 6);
    if (n >= 4) degs.push(4, 4);
    degs.push(1, 1, 1, 1);
    return degs.map((d) => pcs[Math.min(d, n) - 1]);
  },

  'tremolo': (pcs) => Array<number>(8).fill(pcs[0]),

  'legato-cascade': (pcs) => {
    const n = pcs.length;
    const degs: number[] = [];
    if (n >= 5) degs.push(1, 3, 5, 1, 3, 5);
    if (n >= 6) degs.push(2, 4, 6, 2, 4, 6);
    if (degs.length === 0) {
      for (let d = 1; d <= Math.min(3, n); d += 1) degs.push(d, d, d);
    }
    return degs.map((d) => pcs[Math.min(d, n) - 1]);
  },
};

export const buildRelSequence = (
  pcs: PitchClass[],
  mode: PhraseMode,
  octaves: number,
  withDesc = false,
): AbsSemitone[] => {
  const clampOct = Math.max(1, Math.min(5, Math.floor(octaves)));
  const oneOct = modeBuilders[mode]?.(pcs) ?? [];
  return expandAcrossOctaves(oneOct, clampOct, withDesc);
};
