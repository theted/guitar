import { describe, it, expect } from "vitest";
import { getScalePositions, getStringBaseNotes, type PositionNote } from "./positions";
import { getScalePitchClasses, keyToOffset } from "@/music";
import { scales, tones, tunings, concertOctave, type TuningName } from "@/constants";

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

// Scientific pitch name of an abs semitone (E4 = 0, C4 = -4), sharps only like
// the tuning catalog
const pitchName = (abs: number): string =>
  `${tones[((abs % 12) + 12) % 12].toUpperCase()}${Math.floor((abs + 52) / 12)}`;

describe("getStringBaseNotes — every tuning at real pitch", () => {
  // Open strings low to high at the tuning's concert octave (4 for guitar, 2
  // for bass). Down-tuned guitars used to come out almost an octave high
  // (D standard as D3–D5) because the top string was always placed at or
  // above E4.
  const expected: Record<TuningName, string> = {
    Standard: "E2 A2 D3 G3 B3 E4",
    "Eb Standard": "D#2 G#2 C#3 F#3 A#3 D#4",
    "D Standard": "D2 G2 C3 F3 A3 D4",
    "C Standard": "C2 F2 A#2 D#3 G3 C4",
    "B Standard": "B1 E2 A2 D3 F#3 B3",
    "A Standard": "A1 D2 G2 C3 E3 A3",
    "Drop D": "D2 A2 D3 G3 B3 E4",
    "Eb Drop D": "C#2 G#2 C#3 F#3 A#3 D#4",
    "Drop C": "C2 G2 C3 F3 A3 D4",
    "Drop B": "B1 F#2 B2 E3 G#3 C#4",
    "Drop A": "A1 E2 A2 D3 F#3 B3",
    "Open A": "E2 A2 C#3 E3 A3 E4",
    "Open C": "C2 G2 C3 G3 C4 E4",
    "Open D": "D2 A2 D3 F#3 A3 D4",
    "Open E": "E2 B2 E3 G#3 B3 E4",
    "Open G": "D2 G2 D3 G3 B3 D4",
    DADGAD: "D2 A2 D3 G3 A3 D4",
    "7-String Standard": "B1 E2 A2 D3 G3 B3 E4",
    "7-String Drop A": "A1 E2 A2 D3 G3 B3 E4",
    "8-String": "F#1 B1 E2 A2 D3 G3 B3 E4",
    "Bass Standard": "E1 A1 D2 G2",
    "Bass Drop D": "D1 A1 D2 G2",
    "Bass Drop C": "C1 G1 C2 F2",
    "All Fourths": "E2 A2 D3 G3 C4 F4",
    "New Standard": "C2 G2 D3 A3 E4 G4",
    Russian: "D2 G2 B2 E3 A3 D4",
    // Six unison-class strings can only be stacked an octave apart under the
    // strictly-ascending contract, so this one spans five octaves
    Ostrich: "D-1 D0 D1 D2 D3 D4",
    DEAD: "D3 E3 A3 D4",
  };

  it("covers every tuning in the catalog", () => {
    expect(Object.keys(expected).sort()).toEqual(Object.keys(tunings).sort());
  });

  for (const [name, pitches] of Object.entries(expected) as [TuningName, string][]) {
    it(`puts ${name} at ${pitches}`, () => {
      const tuning = tunings[name];
      const base = getStringBaseNotes(tuning, tuning.length, concertOctave(name));
      expect(base.map(pitchName).join(" ")).toBe(pitches);
    });
  }

  it("anchors the top string at exact abs values", () => {
    const top = (name: TuningName) => {
      const base = getStringBaseNotes(tunings[name], tunings[name].length, concertOctave(name));
      return [base[0], base[base.length - 1]];
    };
    expect(top("Standard")).toEqual([-24, 0]); // E2, E4
    expect(top("D Standard")).toEqual([-26, -2]); // D2, D4
    expect(top("A Standard")).toEqual([-31, -7]); // A1, A3
    expect(top("Bass Standard")).toEqual([-36, -21]); // E1, G2
  });

  it("keeps a whole tuning's shape when only the octave changes", () => {
    const d4 = getStringBaseNotes(tunings["D Standard"], 6, 4);
    expect(getStringBaseNotes(tunings["D Standard"], 6, 3)).toEqual(d4.map((n) => n - 12));
    expect(getStringBaseNotes(tunings["D Standard"], 6, 5)).toEqual(d4.map((n) => n + 12));
  });
});
