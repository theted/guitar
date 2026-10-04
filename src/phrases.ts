import { PhraseMode } from './constants';
import type { PitchClass, AbsSemitone } from './types/music';
import { mod12 } from './theory/pitch';

// Every phrase is laid out over the scale stretched across the requested
// octaves: degree 0 is the tonic, degree n × octaves the top tonic, and
// degrees keep counting past an octave instead of restarting. That way a
// pattern carries on across the octave seam the way a player practises it
// (thirds: 1–3 … 6–8, 7–9, then 1–3 an octave up) instead of jumping back.
type Span = {
  /** Notes per octave */
  n: number;
  octaves: number;
  /** Index of the top tonic: n × octaves */
  top: number;
  /** Semitones above the root of degree `i` (0-based, may pass the octave) */
  at: (i: number) => number;
};

const makeSpan = (pcs: readonly number[], octaves: number): Span => {
  const n = pcs.length;
  return {
    n,
    octaves,
    top: n * octaves,
    at: (i) => pcs[((i % n) + n) % n] + 12 * Math.floor(i / n),
  };
};

/**
 * What a mode plays, and what "descend" adds to it:
 * - `peak`: an ascent stopping short of the top tonic (so a loop doesn't
 *   repeat it); descending adds the top tonic, then the ascent backwards.
 * - `mirror`: descending plays the figure back from its last note, so the turn
 *   is a step of the figure itself rather than a jump to a stray peak.
 * - `complete`: the figure already comes back down; descending adds nothing.
 */
type Phrase = { notes: number[]; turn: 'peak' | 'mirror' | 'complete' };

/** Degrees `from` up to (not including) `to` */
const degrees = (span: Span, from: number, to: number): number[] =>
  Array.from({ length: Math.max(0, to - from) }, (_, i) => span.at(from + i));

// Plain run from the tonic up to the degree below the top tonic
const run = (span: Span): Phrase => ({ notes: degrees(span, 0, span.top), turn: 'peak' });

/**
 * A degree pattern (offsets from its first degree) played from every degree in
 * turn, continuing across octave seams, until its highest note is the top
 * tonic: [0, 2] is thirds, [0, 1, 2] groups of three, [0, 2, 4] triads.
 */
const sequence = (span: Span, offsets: readonly number[]): number[] => {
  const reach = Math.max(...offsets);
  const notes: number[] = [];
  for (let start = 0; start + reach <= span.top; start += 1) {
    offsets.forEach((offset) => notes.push(span.at(start + offset)));
  }
  return notes;
};

const ascending = (span: Span, offsets: readonly number[]): Phrase => ({
  notes: sequence(span, offsets),
  turn: 'mirror',
});

/**
 * A figure written for one octave (1-based degrees), played in each octave in
 * turn: riffs move up an octave at a time rather than drifting through the
 * scale.
 */
const perOctave = (span: Span, figure: readonly number[]): number[] => {
  const notes: number[] = [];
  for (let octave = 0; octave < span.octaves; octave += 1) {
    figure.forEach((degree) => notes.push(span.at(octave * span.n + degree - 1)));
  }
  return notes;
};

const riff = (span: Span, figure: readonly number[]): Phrase => ({
  notes: perOctave(span, figure),
  turn: 'mirror',
});

const oneTo = (n: number): number[] => Array.from({ length: n }, (_, i) => i + 1);

const modeBuilders: Record<PhraseMode, (span: Span) => Phrase> = {
  'full-scale': run,
  // The chord's tones arrive as the pcs (selected in usePlayback); ascend them
  'chord-arp': run,

  // Overlapping groups of three: 1-2-3, 2-3-4, 3-4-5 …
  'snake': (span) => (span.n >= 3 ? ascending(span, [0, 1, 2]) : run(span)),
  'motif-1232': (span) => (span.n >= 3 ? ascending(span, [0, 1, 2]) : run(span)),

  // A fixed motif on the lower five degrees, repeated an octave up
  'snake-complex': (span) =>
    riff(span, [1, 4, 3, 2, 3, 4, 3, 2, 5, 4, 3, 4].map((d) => ((d - 1) % span.n) + 1)),

  'four-note-groups': (span) => (span.n >= 4 ? ascending(span, [0, 1, 2, 3]) : run(span)),

  'thirds': (span) => (span.n >= 3 ? ascending(span, [0, 2]) : run(span)),

  'fourths': (span) => (span.n >= 4 ? ascending(span, [0, 3]) : run(span)),

  'sixths': (span) => {
    if (span.n < 6) return span.n >= 3 ? ascending(span, [0, 2]) : run(span);
    // Every degree of the span with the sixth above it, so the line reaches a
    // sixth past the top tonic rather than stopping three degrees in
    const notes: number[] = [];
    for (let degree = 0; degree < span.top; degree += 1) {
      notes.push(span.at(degree), span.at(degree + 5));
    }
    return { notes, turn: 'mirror' };
  },

  'triads': (span) => (span.n >= 5 ? ascending(span, [0, 2, 4]) : run(span)),

  'sevenths': (span) => {
    if (span.n >= 7) return ascending(span, [0, 2, 4, 6]);
    return span.n >= 5 ? ascending(span, [0, 2, 4]) : run(span);
  },

  // Up and back down with the turning note played twice, for even picking
  'alternate-picking': (span) => {
    const up = degrees(span, 0, span.top);
    return { notes: [...up, ...up.slice().reverse()], turn: 'complete' };
  },

  // Each octave's tonic against every other degree of that octave, the pedal
  // moving up with the octave, back on the pedal at the end: 1 2 1 3 … 1 7 1
  'pedal-tone': (span) => {
    const figure = oneTo(span.n).slice(1).flatMap((d) => [1, d]);
    const pedal = span.at((span.octaves - 1) * span.n);
    return { notes: [...perOctave(span, figure.length ? figure : [1]), pedal], turn: 'mirror' };
  },

  'sequence-asc': (span) => (span.n >= 3 ? ascending(span, [0, 1, 2]) : run(span)),

  // The same groups of three from the top tonic down: 8-7-6, 7-6-5 …
  'sequence-desc': (span) => ({
    notes: (span.n >= 3 ? sequence(span, [0, 1, 2]) : degrees(span, 0, span.top + 1)).reverse(),
    turn: 'mirror',
  }),

  // Thirds, finishing with a step onto the top tonic
  'skip-pattern': (span) => {
    const notes: number[] = [];
    for (let degree = 0; degree < span.top; degree += 1) {
      notes.push(span.at(degree), span.at(Math.min(degree + 2, span.top)));
    }
    return { notes, turn: 'mirror' };
  },

  // Every other degree of each octave up, then back down
  'sweep-arp': (span) => {
    const up = perOctave(span, oneTo(span.n).filter((d) => d % 2 === 1));
    return { notes: [...up, ...up.slice(0, -1).reverse()], turn: 'complete' };
  },

  'neo-classical': (span) => {
    const figure = [1, 2, 4, 5, 7].filter((d) => d <= span.n);
    const up = perOctave(span, span.n >= 8 ? [...figure, span.n] : figure);
    return { notes: [...up, ...perOctave(span, figure).reverse()], turn: 'complete' };
  },

  'power-chord': (span) => {
    const fifth = Math.min(5, span.n);
    const fourth = Math.min(4, span.n);
    return riff(span, [1, 1, fifth, fifth, 1, 1, fifth, fifth, fourth, fourth, 1, 1]);
  },

  'djent-palm': (span) => {
    const n = span.n;
    const figure: number[] = [1, 1, 1];
    if (n >= 6) figure.push(6);
    figure.push(1, 1);
    if (n >= 4) figure.push(4);
    figure.push(1, 1);
    if (n >= 5) figure.push(5);
    figure.push(1, 1);
    if (n >= 3) figure.push(3);
    return riff(span, figure);
  },

  'polyrhythm': (span) => riff(span, Array.from({ length: 14 }, (_, i) => ((i % 7) % span.n) + 1)),

  'breakdown-chug': (span) => {
    const figure: number[] = [1, 1, 1, 1];
    if (span.n >= 6) figure.push(6, 6);
    if (span.n >= 4) figure.push(4, 4);
    figure.push(1, 1, 1, 1);
    return riff(span, figure);
  },

  'tremolo': (span) => riff(span, Array<number>(8).fill(1)),

  'legato-cascade': (span) => {
    const n = span.n;
    const figure: number[] = [];
    if (n >= 5) figure.push(1, 3, 5, 1, 3, 5);
    if (n >= 6) figure.push(2, 4, 6, 2, 4, 6);
    if (figure.length === 0) {
      for (let d = 1; d <= Math.min(3, n); d += 1) figure.push(d, d, d);
    }
    return riff(span, figure);
  },
};

/** The UI offers 1–5 octaves; anything else is out of contract */
const clampOctaves = (octaves: number): number =>
  Math.max(1, Math.min(5, Math.floor(octaves)));

/**
 * The phrase as semitones above its root, across `octaves` octaves, plus its
 * way back when `withDesc` is on. No mode jumps between octaves: patterns
 * continue across the octave seam, riffs move up an octave at a time, and the
 * descent turns on the figure's own last note.
 */
export const buildRelSequence = (
  pcs: PitchClass[],
  mode: PhraseMode,
  octaves: number,
  withDesc = false,
): AbsSemitone[] => {
  const builder = modeBuilders[mode];
  if (!builder || pcs.length === 0) return [];
  const span = makeSpan(pcs, clampOctaves(octaves));
  const { notes, turn } = builder(span);
  if (!withDesc || turn === 'complete' || notes.length === 0) return notes as AbsSemitone[];
  const back = notes.slice().reverse();
  const descent = turn === 'peak' ? [span.at(span.top), ...back] : back.slice(1);
  return [...notes, ...descent] as AbsSemitone[];
};

/**
 * Absolute semitone the phrase starts from: the lowest tonic that actually
 * exists on the neck. Phrases are built as offsets from this root, so they
 * follow the fretboard when the tuning or start octave changes instead of
 * staying pinned to the E4 origin.
 */
export const getPhraseRootAbs = (keyOffset: number, lowestAbs: number): number =>
  lowestAbs + mod12(keyOffset - lowestAbs);

/**
 * Largest octave span, up to `requested`, whose highest note still sits under
 * the top fret. A phrase reaching past the neck can be heard but not seen.
 *
 * The span is measured from the sequence itself rather than as octaves × 12,
 * because modes don't all stop at the same place: interval patterns end on the
 * top tonic, `sixths` reaches a sixth past it, a plain ascent stops just below
 * it.
 *
 * Always at least one octave: a neck too short for even that still gets a
 * phrase, just one that runs off the end.
 */
export const getPlayableOctaves = (
  pcs: PitchClass[],
  mode: PhraseMode,
  requested: number,
  withDesc: boolean,
  rootAbs: number,
  highestAbs: number,
): number => {
  for (let octaves = clampOctaves(requested); octaves > 1; octaves -= 1) {
    const sequence = buildRelSequence(pcs, mode, octaves, withDesc);
    if (sequence.length === 0) continue;
    if (rootAbs + Math.max(...sequence) <= highestAbs) return octaves;
  }
  return 1;
};
