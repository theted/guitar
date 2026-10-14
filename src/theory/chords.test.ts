import { describe, it, expect } from "vitest";
import { getDiatonicChords, getChordArpOffsets, chordTones, chordLabel, chordRelativeNames } from "./chords";
import { intervalName } from "./intervals";
import { getScalePitchClasses } from "@/music";
import { scales, KEYS } from "@/constants";

const chordsFor = (key: string, scale: keyof typeof scales) =>
  getDiatonicChords(key, getScalePitchClasses(scales[scale]));

describe("intervalName", () => {
  it("names all twelve intervals", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(intervalName)).toEqual([
      "P1", "m2", "M2", "m3", "M3", "P4", "TT", "P5", "m6", "M6", "m7", "M7",
    ]);
  });

  it("wraps octaves and negatives", () => {
    expect(intervalName(12)).toBe("P1");
    expect(intervalName(19)).toBe("P5");
    expect(intervalName(-5)).toBe("P5");
  });
});

describe("getDiatonicChords — C major", () => {
  const chords = chordsFor("c", "major");

  it("yields the classic seven chords", () => {
    expect(chords.map((c) => c.name)).toEqual(["C", "Dm", "Em", "F", "G", "Am", "Bdim"]);
  });

  it("uses conventional roman numerals", () => {
    expect(chords.map((c) => c.roman)).toEqual(["I", "ii", "iii", "IV", "V", "vi", "vii°"]);
  });

  it("names the seventh chords", () => {
    expect(chords.map((c) => c.seventhName)).toEqual([
      "Cmaj7", "Dm7", "Em7", "Fmaj7", "G7", "Am7", "Bm7b5",
    ]);
  });

  it("exposes triad pitch classes relative to the key", () => {
    // ii = D F A -> 2, 5, 9 semitones above the tonic
    expect(chords[1].pcs).toEqual([2, 5, 9]);
  });
});

describe("getDiatonicChords — other keys and scales", () => {
  it("spells F major's chords with Bb", () => {
    expect(chordsFor("f", "major").map((c) => c.name)).toEqual([
      "F", "Gm", "Am", "Bb", "C", "Dm", "Edim",
    ]);
  });

  it("handles A natural minor", () => {
    const chords = chordsFor("a", "minor");
    expect(chords.map((c) => c.name)).toEqual(["Am", "Bdim", "C", "Dm", "Em", "F", "G"]);
    expect(chords.map((c) => c.roman)).toEqual(["i", "ii°", "III", "iv", "v", "VI", "VII"]);
  });

  it("finds the augmented III and major V of A harmonic minor", () => {
    const chords = chordsFor("a", "harmonic minor");
    expect(chords.map((c) => c.name)).toEqual([
      "Am", "Bdim", "Caug", "Dm", "E", "F", "G#dim",
    ]);
    expect(chords[2].roman).toBe("III+");
    expect(chords[4].roman).toBe("V");
    expect(chords[6].seventhName).toBe("G#dim7");
  });

  it("names flat-key minor chords from the display tonic, never with double flats", () => {
    // Db minor is written as C# minor (it would need Fb, Bbb and Cb)
    expect(chordsFor("db", "minor").map((c) => c.name)).toEqual([
      "C#m", "D#dim", "E", "F#m", "G#m", "A", "B",
    ]);
    expect(chordsFor("ab", "minor").map((c) => c.name)).toEqual([
      "G#m", "A#dim", "B", "C#m", "D#m", "E", "F#",
    ]);
    expect(chordsFor("db", "phrygian").map((c) => c.name)).toEqual([
      "C#m", "D", "E", "F#m", "G#dim", "A", "Bm",
    ]);
  });

  it("never names a mode's chords with a double flat in any key", () => {
    // (Some exotic scales can't avoid one in either name of the tonic, e.g.
    // Db harmonic major's Bbb; spelling.test.ts lists those.)
    const modes = [
      "major", "minor", "dorian", "phrygian", "lydian", "mixolydian", "locrian", "harmonic minor",
    ] as const;
    for (const scale of modes) {
      for (const key of KEYS) {
        for (const chord of chordsFor(key, scale)) expect(chord.name).not.toMatch(/bb/);
      }
    }
  });

  it("returns nothing for non-heptatonic scales", () => {
    expect(chordsFor("e", "pentatonic")).toEqual([]);
    expect(chordsFor("c", "whole tone")).toEqual([]);
    expect(chordsFor("c", "chromatic")).toEqual([]);
  });

  it("never crashes on exotic heptatonic scales", () => {
    const exotics = ["arabian", "persian", "hungarian", "double harmonic", "spanish"] as const;
    for (const scale of exotics) {
      const chords = chordsFor("c", scale);
      expect(chords).toHaveLength(7);
      for (const chord of chords) {
        expect(chord.name).toBeTruthy();
        expect(chord.pcs).toHaveLength(3);
      }
    }
  });
});

describe("seventh chords", () => {
  it("numbers C major's 7th chords", () => {
    expect(chordsFor("c", "major").map((c) => c.seventhRoman)).toEqual([
      "Imaj7", "ii7", "iii7", "IVmaj7", "V7", "vi7", "viiø7",
    ]);
  });

  it("numbers A harmonic minor's, minor-major and augmented included", () => {
    expect(chordsFor("a", "harmonic minor").map((c) => c.seventhRoman)).toEqual([
      "i(maj7)", "iiø7", "III+maj7", "iv7", "V7", "VImaj7", "vii°7",
    ]);
  });

  it("stacks the 7th on the triad and spells all four notes in the key", () => {
    const ii = chordsFor("c", "major")[1];
    expect(ii.seventhPcs).toEqual([2, 5, 9, 0]);
    expect(ii.noteNames).toEqual(["D", "F", "A", "C"]);
    expect(chordsFor("f", "major")[3].noteNames).toEqual(["Bb", "D", "F", "A"]);
  });

  it("gives the triad or the 7th chord, by name and by tones", () => {
    const five = chordsFor("c", "major")[4];
    expect(chordTones(five, false)).toEqual([7, 11, 2]);
    expect(chordTones(five, true)).toEqual([7, 11, 2, 5]);
    expect(chordLabel(five, false)).toEqual({ roman: "V", name: "G" });
    expect(chordLabel(five, true)).toEqual({ roman: "V7", name: "G7" });
  });
});

describe("chordRelativeNames", () => {
  const major = getScalePitchClasses(scales.major);

  // Each row: the scale's notes (C D E F G A B in C major) named from the chord's root
  it.each([
    ["ii (Dm7)", 1, ["♭7", "R", "9", "♭3", "11", "5", "13"]],
    ["V (G7)", 4, ["11", "5", "13", "♭7", "R", "9", "3"]],
    ["vii (Bm7♭5)", 6, ["♭9", "♭3", "11", "♭5", "♭13", "♭7", "R"]],
  ] as const)("names C major from %s", (_, index, names) => {
    expect(chordRelativeNames(major, index)).toEqual(names);
  });

  it("reads the diminished 7th of harmonic minor's vii° by letter", () => {
    // A B C D E F G♯ from G♯: F is a diminished 7th, C a diminished 11th
    expect(chordRelativeNames(getScalePitchClasses(scales["harmonic minor"]), 6)).toEqual([
      "♭9", "♭3", "♭11", "♭5", "♭13", "♭♭7", "R",
    ]);
  });

  it("has nothing to say about scales without diatonic chords", () => {
    expect(chordRelativeNames(getScalePitchClasses(scales.pentatonic), 0)).toEqual([]);
  });
});

describe('getChordArpOffsets', () => {
  const cMajor = () => getDiatonicChords('c', getScalePitchClasses(scales.major));

  it('stacks the tonic triad from its root', () => {
    // C major: C E G, 0 / +4 / +7 above the tonic
    expect(getChordArpOffsets(cMajor()[0].pcs)).toEqual([0, 4, 7]);
  });

  it('keeps the root first when the chord crosses the octave', () => {
    // G major in C is G B D — D wraps below G as a pitch class, so a numeric
    // sort would arpeggiate D-G-B and start on the fifth
    const five = cMajor()[4];
    expect(five.name).toBe('G');
    const offsets = getChordArpOffsets(five.pcs);
    expect(offsets[0]).toBe(five.pcs[0]);
    expect(offsets).toEqual([...offsets].sort((a, b) => a - b));
    // Still a major triad: root, major third, perfect fifth
    expect(offsets.map((o) => o - offsets[0])).toEqual([0, 4, 7]);
  });

  it('ascends for every diatonic chord', () => {
    cMajor().forEach((chord) => {
      const offsets = getChordArpOffsets(chord.pcs);
      expect(offsets[0]).toBe(chord.pcs[0]);
      offsets.slice(1).forEach((value, i) => expect(value).toBeGreaterThan(offsets[i]));
    });
  });
});
