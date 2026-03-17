import { PhraseMode } from './constants';
import type { PitchClass, AbsSemitone } from './types/music';

// Shared helper: builds the degree sequence for the snake/motif-1232 pattern.
// Pattern: 1-2-3-2-3-4-3-4-5-... (overlapping ascending triplets)
const buildSnakeDegSeq = (lastDeg: number): number[] => {
  const degSeq: number[] = [];
  if (lastDeg >= 3) {
    degSeq.push(1, 2, 3, 2);
    for (let deg = 3; deg <= lastDeg - 1; deg += 1) {
      degSeq.push(deg, deg + 1);
      if (deg < lastDeg - 1) {
        degSeq.push(deg);
      }
    }
  } else {
    for (let d = 1; d <= lastDeg; d += 1) degSeq.push(d);
  }
  return degSeq;
};

// Build relative semitone sequence for a given scale's pitch classes (pcs),
// phrase mode, and number of octaves.
export const buildRelSequence = (pcs: PitchClass[], mode: PhraseMode, octaves: number, withDesc: boolean = false): AbsSemitone[] => {
  const clampOct = Math.max(1, Math.min(5, Math.floor(octaves)));

  const expandAcrossOctaves = (oneOctRel: number[], desc: boolean): AbsSemitone[] => {
    const asc: number[] = [];
    for (let o = 0; o < clampOct; o += 1) asc.push(...oneOctRel.map((r) => r + o * 12));
    if (!desc) return asc as AbsSemitone[];
    const apex = (oneOctRel.length > 0 ? clampOct * 12 + oneOctRel[0] : clampOct * 12);
    return [...asc, apex, ...asc.slice().reverse()] as AbsSemitone[];
  };

  if (mode === 'full-scale') {
    return expandAcrossOctaves(pcs, withDesc);
  }

  if (mode === 'snake') {
    const oneOct = buildSnakeDegSeq(pcs.length).map((d) => pcs[d - 1]);
    return expandAcrossOctaves(oneOct, withDesc);
  }

  if (mode === 'snake-complex') {
    const pattern0 = [0,3,2,1,2,3,2,1,4,3,2,3];
    const lastDeg = pcs.length;
    const oneOct = pattern0
      .map((z) => (z % lastDeg + lastDeg) % lastDeg)
      .map((z) => pcs[z]);
    return expandAcrossOctaves(oneOct, withDesc);
  }

  if (mode === 'motif-1232') {
    const oneOct = buildSnakeDegSeq(pcs.length).map((d) => pcs[d - 1]);
    return expandAcrossOctaves(oneOct, withDesc);
  }

  if (mode === 'four-note-groups') {
    const lastDeg = pcs.length;
    const degSeq: number[] = [];
    if (lastDeg >= 4) {
      for (let s = 1; s <= lastDeg - 3; s += 1) degSeq.push(s, s + 1, s + 2, s + 3);
    } else {
      for (let d = 1; d <= lastDeg; d += 1) degSeq.push(d);
    }
    const oneOct = degSeq.map((d) => pcs[d - 1]);
    return expandAcrossOctaves(oneOct, withDesc);
  }

  if (mode === 'thirds') {
    const lastDeg = pcs.length;
    const skip = 2;
    const degSeq: number[] = [];
    for (let s = 1; s + skip <= lastDeg; s += 1) degSeq.push(s, s + skip);
    if (degSeq.length === 0) {
      for (let d = 1; d <= lastDeg; d += 1) degSeq.push(d);
    }
    const oneOct = degSeq.map((d) => pcs[d - 1]);
    return expandAcrossOctaves(oneOct, withDesc);
  }

  if (mode === 'fourths') {
    const lastDeg = pcs.length;
    const skip = 3;
    const degSeq: number[] = [];
    for (let s = 1; s + skip <= lastDeg; s += 1) degSeq.push(s, s + skip);
    if (degSeq.length === 0) { for (let d = 1; d <= lastDeg; d += 1) degSeq.push(d); }
    const oneOct = degSeq.map((d) => pcs[d - 1]);
    return expandAcrossOctaves(oneOct, withDesc);
  }

  if (mode === 'sixths') {
    const lastDeg = pcs.length;
    const gap = 5;
    const degSeq: number[] = [];
    if (lastDeg >= 6) {
      for (let s = 1; s <= lastDeg; s += 1) {
        const t = s + gap;
        const d2 = ((t - 1) % lastDeg) + 1;
        degSeq.push(s, d2);
      }
    } else {
      for (let s = 1; s + 2 <= lastDeg; s += 1) degSeq.push(s, s + 2);
      if (degSeq.length === 0) for (let d = 1; d <= lastDeg; d += 1) degSeq.push(d);
    }
    const oneOct = degSeq.map((d) => pcs[d - 1]);
    return expandAcrossOctaves(oneOct, withDesc);
  }

  if (mode === 'triads') {
    const lastDeg = pcs.length;
    const degSeq: number[] = [];
    for (let s = 1; s + 4 <= lastDeg; s += 1) degSeq.push(s, s + 2, s + 4);
    if (degSeq.length === 0) for (let d = 1; d <= lastDeg; d += 1) degSeq.push(d);
    const oneOct = degSeq.map((d) => pcs[d - 1]);
    return expandAcrossOctaves(oneOct, withDesc);
  }

  if (mode === 'sevenths') {
    const lastDeg = pcs.length;
    const degSeq: number[] = [];
    for (let s = 1; s + 6 <= lastDeg; s += 1) degSeq.push(s, s + 2, s + 4, s + 6);
    if (degSeq.length === 0) {
      for (let s = 1; s + 4 <= lastDeg; s += 1) degSeq.push(s, s + 2, s + 4);
      if (degSeq.length === 0) for (let d = 1; d <= lastDeg; d += 1) degSeq.push(d);
    }
    const oneOct = degSeq.map((d) => pcs[d - 1]);
    return expandAcrossOctaves(oneOct, withDesc);
  }

  // Rock/Metal patterns
  if (mode === 'alternate-picking') {
    const lastDeg = pcs.length;
    const degSeq: number[] = [];
    for (let d = 1; d <= lastDeg; d += 1) degSeq.push(d);
    for (let d = lastDeg; d >= 1; d -= 1) degSeq.push(d);
    const oneOct = degSeq.map((d) => pcs[d - 1]);
    return expandAcrossOctaves(oneOct, withDesc);
  }

  if (mode === 'pedal-tone') {
    const lastDeg = pcs.length;
    const degSeq: number[] = [1];
    for (let d = 2; d <= lastDeg; d += 1) {
      degSeq.push(d, 1);
    }
    const oneOct = degSeq.map((d) => pcs[d - 1]);
    return expandAcrossOctaves(oneOct, withDesc);
  }

  if (mode === 'sequence-asc') {
    const lastDeg = pcs.length;
    const degSeq: number[] = [];
    for (let d = 1; d <= lastDeg - 2; d += 1) {
      degSeq.push(d, d + 1, d + 2);
    }
    const oneOct = degSeq.map((d) => pcs[d - 1]);
    return expandAcrossOctaves(oneOct, withDesc);
  }

  if (mode === 'sequence-desc') {
    const lastDeg = pcs.length;
    const degSeq: number[] = [];
    for (let d = lastDeg; d >= 3; d -= 1) {
      degSeq.push(d, d - 1, d - 2);
    }
    const oneOct = degSeq.map((d) => pcs[d - 1]);
    return expandAcrossOctaves(oneOct, withDesc);
  }

  if (mode === 'skip-pattern') {
    const lastDeg = pcs.length;
    const degSeq: number[] = [];
    for (let d = 1; d <= lastDeg - 1; d += 1) {
      if (d + 2 <= lastDeg) {
        degSeq.push(d, d + 2);
      } else {
        degSeq.push(d, d + 1);
      }
    }
    const oneOct = degSeq.map((d) => pcs[d - 1]);
    return expandAcrossOctaves(oneOct, withDesc);
  }

  if (mode === 'sweep-arp') {
    const lastDeg = pcs.length;
    const degSeq: number[] = [];
    for (let d = 1; d <= lastDeg; d += 2) degSeq.push(d);
    for (let i = degSeq.length - 2; i >= 0; i -= 1) {
      degSeq.push(degSeq[i]);
    }
    const oneOct = degSeq.map((d) => pcs[d - 1]);
    return expandAcrossOctaves(oneOct, withDesc);
  }

  if (mode === 'neo-classical') {
    const lastDeg = pcs.length;
    const degSeq: number[] = [];
    const pattern = [1, 2, 4, 5];
    if (lastDeg >= 7) pattern.push(7);

    pattern.forEach(d => { if (d <= lastDeg) degSeq.push(d); });
    if (lastDeg >= 8) degSeq.push(lastDeg);

    for (let i = pattern.length - 1; i >= 0; i -= 1) {
      if (pattern[i] <= lastDeg) degSeq.push(pattern[i]);
    }

    const oneOct = degSeq.map((d) => pcs[d - 1]);
    return expandAcrossOctaves(oneOct, withDesc);
  }

  if (mode === 'power-chord') {
    const lastDeg = pcs.length;
    const fifth = lastDeg >= 5 ? 5 : lastDeg;
    const fourth = lastDeg >= 4 ? 4 : lastDeg;
    const degSeq = [1, 1, fifth, fifth, 1, 1, fifth, fifth, fourth, fourth, 1, 1];
    const oneOct = degSeq.map((d) => pcs[d - 1]);
    return expandAcrossOctaves(oneOct, withDesc);
  }

  if (mode === 'djent-palm') {
    const lastDeg = pcs.length;
    const degSeq: number[] = [1, 1, 1];
    if (lastDeg >= 6) degSeq.push(6);
    degSeq.push(1, 1);
    if (lastDeg >= 4) degSeq.push(4);
    degSeq.push(1, 1);
    if (lastDeg >= 5) degSeq.push(5);
    degSeq.push(1, 1);
    if (lastDeg >= 3) degSeq.push(3);

    const oneOct = degSeq.map((d) => pcs[Math.min(d, lastDeg) - 1]);
    return expandAcrossOctaves(oneOct, withDesc);
  }

  if (mode === 'polyrhythm') {
    const lastDeg = pcs.length;
    const degSeq: number[] = [];
    for (let i = 0; i < 14; i += 1) {
      degSeq.push(((i % 7) % lastDeg) + 1);
    }
    const oneOct = degSeq.map((d) => pcs[d - 1]);
    return expandAcrossOctaves(oneOct, withDesc);
  }

  if (mode === 'breakdown-chug') {
    const lastDeg = pcs.length;
    const degSeq: number[] = [1, 1, 1, 1];
    if (lastDeg >= 6) degSeq.push(6, 6);
    if (lastDeg >= 4) degSeq.push(4, 4);
    degSeq.push(1, 1, 1, 1);

    const oneOct = degSeq.map((d) => pcs[Math.min(d, lastDeg) - 1]);
    return expandAcrossOctaves(oneOct, withDesc);
  }

  if (mode === 'tremolo') {
    const degSeq: number[] = Array(8).fill(1);
    const oneOct = degSeq.map((d) => pcs[d - 1]);
    return expandAcrossOctaves(oneOct, withDesc);
  }

  if (mode === 'legato-cascade') {
    const lastDeg = pcs.length;
    const degSeq: number[] = [];

    if (lastDeg >= 5) {
      degSeq.push(1, 3, 5, 1, 3, 5);
    }

    if (lastDeg >= 6) {
      degSeq.push(2, 4, 6, 2, 4, 6);
    }

    if (degSeq.length === 0) {
      for (let d = 1; d <= Math.min(3, lastDeg); d += 1) {
        degSeq.push(d, d, d);
      }
    }

    const oneOct = degSeq.map((d) => pcs[Math.min(d, lastDeg) - 1]);
    return expandAcrossOctaves(oneOct, withDesc);
  }

  return [];
};
