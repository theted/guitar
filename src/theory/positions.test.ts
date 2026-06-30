import { describe, it, expect } from "vitest";
import { getScalePositions, getStringBaseNotes, type PositionNote } from "./positions";
import { getScalePitchClasses, keyToOffset } from "@/music";
import { scales, tunings } from "@/constants";

// Standard tuning E2 A2 D3 G3 B3 E4, abs semitones relative to E4 = 0
const STANDARD = [-24, -19, -14, -9, -5, 0];
// Drop D: D2 A2 D3 G3 B3 E4
const DROP_D = [-26, -19, -14, -9, -5, 0];

const positionsFor = (
  scale: keyof typeof scales,
  key: string,
  stringBaseNotes: number[] = STANDARD,
  span = 5,
  frets = 24
) =>
  getScalePositions({
    stringBaseNotes,
    frets,
    keyOffset: keyToOffset(key),
    scalePcs: getScalePitchClasses(scales[scale]),
    span,
  });

const asTriples = (notes: PositionNote[]) =>
  notes.map((n) => [n.stringIndex, n.fret, n.abs]);

describe("getScalePositions — E minor pentatonic, standard tuning", () => {
  const positions = positionsFor("pentatonic", "e");

  it("yields one position per scale degree", () => {
    expect(positions).toHaveLength(5);
    expect(positions.map((p) => p.lowFret)).toEqual([0, 3, 5, 7, 10]);
  });

  it("position 1 is the textbook open box", () => {
    expect(asTriples(positions[0].notes)).toEqual([
      [0, 0, -24], // E2
      [0, 3, -21], // G2
      [1, 0, -19], // A2
      [1, 2, -17], // B2
      [2, 0, -14], // D3
      [2, 2, -12], // E3
      [3, 0, -9],  // G3
      [3, 2, -7],  // A3
      [4, 0, -5],  // B3
      [4, 3, -2],  // D4
      [5, 0, 0],   // E4
      [5, 3, 3],   // G4
    ]);
  });

  it("position 2 spans frets 3–7 and stays strictly ascending", () => {
    const p2 = positions[1];
    expect(p2.lowFret).toBe(3);
    expect(p2.highFret).toBe(7);
    // G2 A2 B2 D3 E3 G3 A3 B3 D4 E4 G4 A4 B4
    expect(asTriples(p2.notes)).toEqual([
      [0, 3, -21], [0, 5, -19], [0, 7, -17],
      [1, 5, -14], [1, 7, -12],
      [2, 5, -9],  [2, 7, -7],
      [3, 4, -5],
      [4, 3, -2],  [4, 5, 0],
      [5, 3, 3],   [5, 5, 5],  [5, 7, 7],
    ]);
  });

  it("each pitch appears exactly once per position (no unison doubling)", () => {
    for (const position of positions) {
      const pitches = position.notes.map((n) => n.abs);
      expect(new Set(pitches).size).toBe(pitches.length);
      for (let i = 1; i < pitches.length; i += 1) {
        expect(pitches[i]).toBeGreaterThan(pitches[i - 1]);
      }
    }
  });

  it("never places a note outside the position window", () => {
    for (const position of positions) {
      for (const note of position.notes) {
        expect(note.fret).toBeGreaterThanOrEqual(position.lowFret);
        expect(note.fret).toBeLessThanOrEqual(position.highFret);
      }
    }
  });
});

describe("getScalePositions — other scales and tunings", () => {
  it("C major in standard tuning yields seven positions", () => {
    const positions = positionsFor("major", "c");
    expect(positions).toHaveLength(7);
    // Anchors are the C-major scale tones on the low E string below fret 12:
    // F G A B C D E -> frets 1 3 5 7 8 10 12? (E at 0 is in scale too)
    expect(positions.map((p) => p.lowFret)).toEqual([0, 1, 3, 5, 7, 8, 10]);
  });

  it("works in drop D", () => {
    const positions = positionsFor("pentatonic", "e", DROP_D);
    // Low D string scale tones below fret 12: D(0) E(2) G(5) A(7) B(9)
    expect(positions.map((p) => p.lowFret)).toEqual([0, 2, 5, 7, 9]);
    for (const position of positions) {
      const pitches = position.notes.map((n) => n.abs);
      for (let i = 1; i < pitches.length; i += 1) {
        expect(pitches[i]).toBeGreaterThan(pitches[i - 1]);
      }
    }
  });

  it("clamps windows at the last fret", () => {
    const positions = positionsFor("pentatonic", "e", STANDARD, 5, 12);
    const last = positions[positions.length - 1];
    expect(last.highFret).toBeLessThanOrEqual(12);
    for (const note of last.notes) expect(note.fret).toBeLessThanOrEqual(12);
  });

  it("respects a narrower span", () => {
    const positions = positionsFor("pentatonic", "e", STANDARD, 4);
    for (const position of positions) {
      expect(position.highFret - position.lowFret).toBeLessThanOrEqual(3);
    }
  });
});

describe("getStringBaseNotes — base-tone layout", () => {
  it("matches the canonical standard tuning (E2..E4 relative to E4=0)", () => {
    expect(getStringBaseNotes(tunings.Standard, 6, 4)).toEqual(STANDARD);
  });

  it("places drop D's low string a whole step below standard", () => {
    expect(getStringBaseNotes(tunings["Drop D"], 6, 4)).toEqual(DROP_D);
  });

  it("shifts the whole array by an octave when startOctave changes", () => {
    const up = getStringBaseNotes(tunings.Standard, 6, 5);
    expect(up).toEqual(STANDARD.map((n) => n + 12));
  });

  // Regression: the UI lets the string count exceed the tuning length
  // (FormNumber min=1 max=12, independent of tuning). Extra strings must keep
  // extending downward — the array stays sorted low→high with no duplicates,
  // the contract getScalePositions' unison logic and the renderer depend on.
  it("stays monotonic and unique when strings exceed the tuning length", () => {
    for (const tuningName of Object.keys(tunings) as (keyof typeof tunings)[]) {
      for (let strings = 1; strings <= 12; strings += 1) {
        const base = getStringBaseNotes(tunings[tuningName], strings, 4);
        expect(base).toHaveLength(strings);
        for (let i = 1; i < base.length; i += 1) {
          expect(base[i]).toBeGreaterThan(base[i - 1]);
        }
      }
    }
  });

  it("extends an 8-string standard below the low E (no scrambling)", () => {
    // The two added strings sit below E2, not above it.
    expect(getStringBaseNotes(tunings.Standard, 8, 4)).toEqual([
      -41, -36, -24, -19, -14, -9, -5, 0,
    ]);
  });
});
