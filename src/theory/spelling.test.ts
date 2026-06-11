import { describe, it, expect } from "vitest";
import {
  parseKey,
  formatNote,
  getScaleSpelling,
  getSpellingMap,
  formatNoteWithOctave,
} from "./spelling";
import { getScalePitchClasses } from "@/music";
import { scales } from "@/constants";

const spell = (key: string, scale: keyof typeof scales): string[] =>
  getScaleSpelling(key, getScalePitchClasses(scales[scale])).map(formatNote);

describe("parseKey", () => {
  it("parses naturals, sharps and flats", () => {
    expect(parseKey("e")).toMatchObject({ letter: "E", accidental: 0, pc: 0 });
    expect(parseKey("f#")).toMatchObject({ letter: "F", accidental: 1, pc: 2 });
    expect(parseKey("bb")).toMatchObject({ letter: "B", accidental: -1, pc: 6 });
    expect(parseKey("c")).toMatchObject({ letter: "C", accidental: 0, pc: 8 });
  });

  it("maps enharmonic equivalents to the same pitch class", () => {
    expect(parseKey("a#").pc).toBe(parseKey("bb").pc);
    expect(parseKey("d#").pc).toBe(parseKey("eb").pc);
    expect(parseKey("c#").pc).toBe(parseKey("db").pc);
    expect(parseKey("g#").pc).toBe(parseKey("ab").pc);
  });
});

describe("major scale spelling (all 12 keys)", () => {
  const expected: Record<string, string[]> = {
    c: ["C", "D", "E", "F", "G", "A", "B"],
    g: ["G", "A", "B", "C", "D", "E", "F#"],
    d: ["D", "E", "F#", "G", "A", "B", "C#"],
    a: ["A", "B", "C#", "D", "E", "F#", "G#"],
    e: ["E", "F#", "G#", "A", "B", "C#", "D#"],
    b: ["B", "C#", "D#", "E", "F#", "G#", "A#"],
    "f#": ["F#", "G#", "A#", "B", "C#", "D#", "E#"],
    db: ["Db", "Eb", "F", "Gb", "Ab", "Bb", "C"],
    ab: ["Ab", "Bb", "C", "Db", "Eb", "F", "G"],
    eb: ["Eb", "F", "G", "Ab", "Bb", "C", "D"],
    bb: ["Bb", "C", "D", "Eb", "F", "G", "A"],
    f: ["F", "G", "A", "Bb", "C", "D", "E"],
  };

  for (const [key, notes] of Object.entries(expected)) {
    it(`spells ${key} major as ${notes.join(" ")}`, () => {
      expect(spell(key, "major")).toEqual(notes);
    });
  }
});

describe("natural minor scale spelling", () => {
  const expected: Record<string, string[]> = {
    a: ["A", "B", "C", "D", "E", "F", "G"],
    e: ["E", "F#", "G", "A", "B", "C", "D"],
    d: ["D", "E", "F", "G", "A", "Bb", "C"],
    "f#": ["F#", "G#", "A", "B", "C#", "D", "E"],
    bb: ["Bb", "C", "Db", "Eb", "F", "Gb", "Ab"],
    eb: ["Eb", "F", "Gb", "Ab", "Bb", "Cb", "Db"],
  };

  for (const [key, notes] of Object.entries(expected)) {
    it(`spells ${key} minor as ${notes.join(" ")}`, () => {
      expect(spell(key, "minor")).toEqual(notes);
    });
  }
});

describe("other heptatonic scales", () => {
  it("spells A harmonic minor with G#", () => {
    expect(spell("a", "harmonic minor")).toEqual(["A", "B", "C", "D", "E", "F", "G#"]);
  });

  it("spells C double harmonic (Byzantine)", () => {
    expect(spell("c", "double harmonic")).toEqual(["C", "Db", "E", "F", "G", "Ab", "B"]);
  });

  it("spells D dorian all-natural", () => {
    expect(spell("d", "dorian")).toEqual(["D", "E", "F", "G", "A", "B", "C"]);
  });

  it("spells E phrygian all-natural", () => {
    expect(spell("e", "phrygian")).toEqual(["E", "F", "G", "A", "B", "C", "D"]);
  });

  it("spells F lydian with B natural", () => {
    expect(spell("f", "lydian")).toEqual(["F", "G", "A", "B", "C", "D", "E"]);
  });
});

describe("non-heptatonic scales (key-signature fallback)", () => {
  it("spells E minor pentatonic", () => {
    expect(spell("e", "pentatonic")).toEqual(["E", "G", "A", "B", "D"]);
  });

  it("spells Bb major pentatonic with flats", () => {
    expect(spell("bb", "pentatonic major")).toEqual(["Bb", "C", "D", "F", "G"]);
  });

  it("spells C whole tone with sharps", () => {
    expect(spell("c", "whole tone")).toEqual(["C", "D", "E", "F#", "G#", "A#"]);
  });

  it("spells F blues with flats", () => {
    expect(spell("f", "blues")).toEqual(["F", "Ab", "Bb", "B", "C", "Eb"]);
  });

  it("spells A blues with sharps", () => {
    expect(spell("a", "blues")).toEqual(["A", "C", "D", "D#", "E", "G"]);
  });
});

describe("getSpellingMap", () => {
  it("spells non-scale notes with the key's accidental preference", () => {
    const map = getSpellingMap("f", getScalePitchClasses(scales.major));
    // F#'s pitch class (app pc 2) is not in F major; flat key -> "Gb"
    expect(formatNote(map[2])).toBe("Gb");
    // C#'s pitch class (app pc 9) -> "Db"
    expect(formatNote(map[9])).toBe("Db");
  });

  it("keeps scale notes spelled by degree", () => {
    const map = getSpellingMap("f", getScalePitchClasses(scales.major));
    // Bb (app pc 6) is the 4th degree of F major
    expect(formatNote(map[6])).toBe("Bb");
  });

  it("uses sharps for non-scale notes in sharp keys", () => {
    const map = getSpellingMap("g", getScalePitchClasses(scales.major));
    // G#/Ab (app pc 4) is not in G major; sharp key -> "G#"
    expect(formatNote(map[4])).toBe("G#");
  });
});

describe("formatNoteWithOctave", () => {
  const cMajorMap = getSpellingMap("c", getScalePitchClasses(scales.major));

  it("anchors E4 at abs 0 and C5 at abs 8", () => {
    expect(formatNoteWithOctave(0, cMajorMap)).toBe("E4");
    expect(formatNoteWithOctave(8, cMajorMap)).toBe("C5");
    expect(formatNoteWithOctave(-12, cMajorMap)).toBe("E3");
    expect(formatNoteWithOctave(12, cMajorMap)).toBe("E5");
  });

  it("derives the octave from the letter, not the sounding pitch (Cb edge)", () => {
    // Eb natural minor contains Cb; sounding B4 (abs 7) must display as Cb5
    const map = getSpellingMap("eb", getScalePitchClasses(scales.minor));
    expect(formatNoteWithOctave(7, map)).toBe("Cb5");
  });
});
