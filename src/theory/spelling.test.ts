import { describe, it, expect } from "vitest";
import {
  parseKey,
  formatNote,
  getScaleSpelling,
  getSpellingMap,
  getDisplayTonic,
  getDegreeNames,
  formatNoteWithOctave,
} from "./spelling";
import { degreeNames } from "./intervals";
import { mod12 } from "./pitch";
import { getScalePitchClasses, keyToOffset } from "@/music";
import { scales, KEYS, type KeyName, type ScaleName } from "@/constants";

const spell = (key: string, scale: keyof typeof scales): string[] =>
  getScaleSpelling(key, getScalePitchClasses(scales[scale])).map(formatNote);

const displayTonic = (key: string, scale: ScaleName): string =>
  formatNote(getDisplayTonic(key, getScalePitchClasses(scales[scale])));

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

describe("natural minor scale spelling (all 12 keys)", () => {
  const expected: Record<string, string[]> = {
    c: ["C", "D", "Eb", "F", "G", "Ab", "Bb"],
    g: ["G", "A", "Bb", "C", "D", "Eb", "F"],
    d: ["D", "E", "F", "G", "A", "Bb", "C"],
    a: ["A", "B", "C", "D", "E", "F", "G"],
    e: ["E", "F#", "G", "A", "B", "C", "D"],
    b: ["B", "C#", "D", "E", "F#", "G", "A"],
    "f#": ["F#", "G#", "A", "B", "C#", "D", "E"],
    // Db minor would be Db Eb Fb Gb Ab Bbb Cb: written as C# minor
    db: ["C#", "D#", "E", "F#", "G#", "A", "B"],
    // Ab minor would be seven flats with Cb and Fb: written as G# minor
    ab: ["G#", "A#", "B", "C#", "D#", "E", "F#"],
    // Six flats with Cb, or six sharps with E# (D# minor): a tie keeps Eb
    eb: ["Eb", "F", "Gb", "Ab", "Bb", "Cb", "Db"],
    bb: ["Bb", "C", "Db", "Eb", "F", "Gb", "Ab"],
    f: ["F", "G", "Ab", "Bb", "C", "Db", "Eb"],
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

describe("non-heptatonic scales (spelled by degree)", () => {
  it("spells E minor pentatonic", () => {
    expect(spell("e", "pentatonic")).toEqual(["E", "G", "A", "B", "D"]);
  });

  it("spells Bb major pentatonic with flats", () => {
    expect(spell("bb", "pentatonic major")).toEqual(["Bb", "C", "D", "F", "G"]);
  });

  it("spells C whole tone as 1 2 3 #4 #5 b7", () => {
    expect(spell("c", "whole tone")).toEqual(["C", "D", "E", "F#", "G#", "Bb"]);
  });

  it("spells the blue note as a flat five", () => {
    expect(spell("e", "blues")).toEqual(["E", "G", "A", "Bb", "B", "D"]);
    expect(spell("a", "blues")).toEqual(["A", "C", "D", "Eb", "E", "G"]);
  });

  it("avoids Cb for the flat five of F blues", () => {
    expect(spell("f", "blues")).toEqual(["F", "Ab", "Bb", "B", "C", "Eb"]);
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

describe("getDisplayTonic — the name a key is written in for a scale", () => {
  it.each<[string, ScaleName, string]>([
    ["db", "minor", "C#"],
    ["ab", "minor", "G#"],
    ["eb", "minor", "Eb"], // tie: Cb (Eb minor) vs E# (D# minor)
    ["bb", "minor", "Bb"],
    ["db", "major", "Db"],
    ["f#", "major", "F#"], // tie: E# (F# major) vs Cb (Gb major)
    ["f#", "lydian", "Gb"], // F# lydian needs B# and E#
    ["db", "phrygian", "C#"],
    ["eb", "locrian", "D#"],
    ["bb", "locrian", "A#"],
    ["db", "pentatonic", "C#"],
    ["db", "japanese", "C#"],
    ["eb", "pentatonic", "Eb"],
    ["c", "minor", "C"],
    ["e", "lydian", "E"],
  ])("writes %s %s from %s", (key, scale, tonic) => {
    expect(displayTonic(key, scale)).toBe(tonic);
  });

  it("never moves a natural key", () => {
    for (const scale of Object.keys(scales) as ScaleName[]) {
      for (const key of ["c", "d", "e", "f", "g", "a", "b"]) {
        expect(displayTonic(key, scale)).toBe(key.toUpperCase());
      }
    }
  });

  it("is always the first note of the spelled scale", () => {
    for (const scale of Object.keys(scales) as ScaleName[]) {
      for (const key of KEYS) {
        expect(spell(key, scale)[0]).toBe(displayTonic(key, scale));
      }
    }
  });
});

describe("flat keys with minor-type scales (no double flats, no Cb/Fb)", () => {
  it.each<[string, ScaleName, string]>([
    ["db", "minor", "C# D# E F# G# A B"],
    ["ab", "minor", "G# A# B C# D# E F#"],
    ["db", "phrygian", "C# D E F# G# A B"],
    ["db", "locrian", "C# D E F# G A B"],
    ["db", "dorian", "C# D# E F# G# A# B"],
    ["eb", "phrygian", "D# E F# G# A# B C#"],
    ["bb", "locrian", "A# B C# D# E F# G#"],
    ["db", "pentatonic", "C# E F# G# B"],
    ["db", "japanese", "C# D F# G# A"],
    ["db", "blues", "C# E F# G G# B"],
    ["f#", "lydian", "Gb Ab Bb C Db Eb F"],
  ])("spells %s %s as %s", (key, scale, notes) => {
    expect(spell(key, scale).join(" ")).toBe(notes);
  });

  it("spells non-scale notes the way the display tonic does", () => {
    // Db minor is shown as C# minor, so the notes outside it take sharps too
    const map = getSpellingMap("db", getScalePitchClasses(scales.minor));
    expect(formatNote(map[mod12(keyToOffset("d"))])).toBe("D");
    expect(formatNote(map[mod12(keyToOffset("d#"))])).toBe("D#");
    expect(formatNote(map[mod12(keyToOffset("g"))])).toBe("G");
    expect(formatNote(map[mod12(keyToOffset("a#"))])).toBe("A#");
  });
});

describe("scales of eight and twelve notes spell by degree", () => {
  it("spells diminished under its degrees 1 ♭2 ♭3 3 ♯4 5 6 ♭7", () => {
    expect(spell("c", "diminished")).toEqual(["C", "Db", "Eb", "E", "F#", "G", "A", "Bb"]);
    expect(spell("g", "diminished")).toEqual(["G", "Ab", "Bb", "B", "C#", "D", "E", "F"]);
    expect(spell("f", "diminished")).toEqual(["F", "Gb", "Ab", "A", "B", "C", "D", "Eb"]);
  });

  it.each<[KeyName, string, string]>([
    ["c", "C C# D D# E F F# G G# A A# B", "1 ♯1 2 ♯2 3 4 ♯4 5 ♯5 6 ♯6 7"],
    ["g", "G G# A A# B C C# D D# E F F#", "1 ♯1 2 ♯2 3 4 ♯4 5 ♯5 6 ♭7 7"],
    ["e", "E F F# G G# A A# B C C# D D#", "1 ♭2 2 ♭3 3 4 ♯4 5 ♭6 6 ♭7 7"],
    ["b", "B C C# D D# E F F# G G# A A#", "1 ♭2 2 ♭3 3 4 ♭5 5 ♭6 6 ♭7 7"],
    ["f#", "F# G G# A A# B C C# D D# E E#", "1 ♭2 2 ♭3 3 4 ♭5 5 ♭6 6 ♭7 7"],
    ["db", "Db D Eb E F Gb G Ab A Bb B C", "1 ♯1 2 ♯2 3 4 ♯4 5 ♯5 6 ♯6 7"],
    ["f", "F Gb G Ab A Bb B C Db D Eb E", "1 ♭2 2 ♭3 3 4 ♯4 5 ♭6 6 ♭7 7"],
  ])("spells %s chromatic as %s, read as %s", (key, notes, degrees) => {
    const pcs = getScalePitchClasses(scales.chromatic);
    expect(spell(key, "chromatic").join(" ")).toBe(notes);
    expect(getDegreeNames(key, pcs).join(" ")).toBe(degrees);
  });

  it("writes the chromatic scale with sharps in sharp keys and flats in flat keys", () => {
    const pcs = getScalePitchClasses(scales.chromatic);
    for (const key of KEYS) {
      const accidentals = getScaleSpelling(key, pcs).map((note) => note.accidental);
      const flatKey = key === "f" || (key.length > 1 && key.endsWith("b"));
      if (flatKey) expect(accidentals.some((a) => a > 0)).toBe(false);
      else expect(accidentals.some((a) => a < 0)).toBe(false);
    }
  });

  it("uses the scale's own degree names everywhere but the chromatic", () => {
    for (const scale of Object.keys(scales) as ScaleName[]) {
      if (scale === "chromatic") continue;
      const pcs = getScalePitchClasses(scales[scale]);
      for (const key of KEYS) expect(getDegreeNames(key, pcs)).toEqual(degreeNames(pcs));
    }
  });
});

// The sweep: every scale in every key. Helpers here deliberately don't use the
// spelling module, so they check it rather than restate it.
const LETTER_ORDER = "CDEFGAB";
const NATURAL: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const accidentalOf = (name: string): number =>
  [...name.slice(1)].reduce((sum, ch) => sum + (ch === "#" ? 1 : -1), 0);
/** E-rooted pitch class of a written note, e.g. "Fb" → 0 */
const pcOfName = (name: string): number => mod12(NATURAL[name[0]] + accidentalOf(name) - 4);
const awkward = (name: string): boolean => {
  const acc = accidentalOf(name);
  return (
    Math.abs(acc) > 1 ||
    (acc === -1 && "CF".includes(name[0])) ||
    (acc === 1 && "EB".includes(name[0]))
  );
};
/** The letter a degree label puts a note on: "♭3" from C → E */
const letterFor = (tonic: string, label: string): string =>
  LETTER_ORDER[(LETTER_ORDER.indexOf(tonic[0]) + Number(label.replace(/[♭♯]/g, "")) - 1) % 7];

/** A scale written from a tonic with each note on its degree label's letter */
const literalSpelling = (tonic: string, pcs: readonly number[], labels: string[]): string[] =>
  pcs.map((pc, i) => {
    const letter = letterFor(tonic, labels[i]);
    let acc: number = mod12(NATURAL[tonic[0]] + accidentalOf(tonic) + pc - NATURAL[letter]);
    if (acc > 6) acc -= 12;
    return letter + (acc > 0 ? "#".repeat(acc) : "b".repeat(-acc));
  });

// Every name a selectable key can be written in
const TONIC_NAMES: Record<KeyName, string[]> = {
  c: ["C"], g: ["G"], d: ["D"], a: ["A"], e: ["E"], b: ["B"], f: ["F"],
  "f#": ["F#", "Gb"], db: ["Db", "C#"], ab: ["Ab", "G#"], eb: ["Eb", "D#"], bb: ["Bb", "A#"],
};

// The pairs where no name of the tonic spells the scale without a double
// accidental or Cb/Fb/E#/B# on its degrees' letters. Seven-note scales (and
// the chromatic) keep the awkward note, as key signatures do; the others
// write it with the key's plain sharps or flats instead, off its degree's
// letter (F blues: B for the ♭5). Every pair not listed is clean, with each
// letter matching its degree label.
const UNAVOIDABLE: Record<string, string> = {
  "f# major": "F# G# A# B C# D# E#",
  "eb minor": "Eb F Gb Ab Bb Cb Db",
  "bb blues": "Bb Db Eb E F Ab",
  "f blues": "F Ab Bb B C Eb",
  "ab dorian": "Ab Bb Cb Db Eb F Gb",
  "bb phrygian": "Bb Cb Db Eb F Gb Ab",
  "b lydian": "B C# D# E# F# G# A#",
  "db mixolydian": "Db Eb F Gb Ab Bb Cb",
  "f locrian": "F Gb Ab Bb Cb Db Eb",
  "f# harmonic minor": "F# G# A B C# D E#",
  "db harmonic minor": "C# D# E F# G# A B#",
  "ab harmonic minor": "G# A# B C# D# E F##",
  "eb harmonic minor": "Eb F Gb Ab Bb Cb D",
  "f# harmonic major": "F# G# A# B C# D E#",
  "db harmonic major": "Db Eb F Gb Ab Bbb C",
  "ab harmonic major": "Ab Bb C Db Eb Fb G",
  "eb harmonic major": "Eb F G Ab Bb Cb D",
  "db arabian": "C# D# E# F# G A B",
  "ab arabian": "G# A# B# C# D E F#",
  "eb arabian": "Eb F G Ab Bbb Cb Db",
  "bb arabian": "Bb C D Eb Fb Gb Ab",
  "f arabian": "F G A Bb Cb Db Eb",
  "f# persian": "F# G A# B C D E#",
  "db persian": "C# D E# F# G A B#",
  "ab persian": "G# A B# C# D E F##",
  "eb persian": "D# E F## G# A B C##",
  "bb persian": "Bb Cb D Eb Fb Gb A",
  "f persian": "F Gb A Bb Cb Db E",
  "f# double harmonic": "F# G A# B C# D E#",
  "db double harmonic": "C# D E# F# G# A B#",
  "ab double harmonic": "Ab Bbb C Db Eb Fb G",
  "eb double harmonic": "Eb Fb G Ab Bb Cb D",
  "bb double harmonic": "Bb Cb D Eb F Gb A",
  "b hungarian": "B C# D E# F# G A#",
  "f# hungarian": "F# G# A B# C# D E#",
  "db hungarian": "Db Eb Fb G Ab Bbb C",
  "ab hungarian": "Ab Bb Cb D Eb Fb G",
  "eb hungarian": "Eb F Gb A Bb Cb D",
  "db spanish": "C# D E# F# G# A B",
  "ab spanish": "G# A B# C# D# E F#",
  "eb spanish": "D# E F## G# A# B C#",
  "bb spanish": "Bb Cb D Eb F Gb Ab",
  "bb japanese": "Bb B Eb F Gb",
  "eb hirajoshi": "Eb F Gb Bb B",
  "a whole tone": "A B C# D# F G",
  "e whole tone": "E F# G# A# C D",
  "b whole tone": "B C# D# F G A",
  "f# whole tone": "Gb Ab Bb C D E",
  "db whole tone": "Db Eb F G A B",
  "b diminished": "B C D D# F F# G# A",
  "f# diminished": "F# G A A# C C# D# E",
  "db diminished": "C# D E F G G# A# B",
  "ab diminished": "Ab A B C D Eb F Gb",
  "eb diminished": "Eb E Gb G A Bb C Db",
  "bb diminished": "Bb B Db D E F G Ab",
  "f# chromatic": "F# G G# A A# B C C# D D# E E#",
  "ab minor thirds": "G# B D F",
  "eb minor thirds": "Eb Gb A C",
  "bb minor thirds": "Bb Db E G",
  "f minor thirds": "F Ab B D",
  "a major thirds": "A C# F",
  "e major thirds": "E G# C",
  "b major thirds": "B D# G",
};

describe("spelling sweep — every scale in every key", () => {
  for (const scale of Object.keys(scales) as ScaleName[]) {
    const pcs = getScalePitchClasses(scales[scale]);
    // Seven-note scales and the chromatic keep every note on its degree letter
    const keepsLetters = pcs.length === 7 || pcs.length === 12;

    for (const key of KEYS) {
      const pair = `${key} ${scale}`;
      it(`spells ${pair}`, () => {
        const notes = spell(key, scale);
        const labels = getDegreeNames(key, pcs);
        const lettersMatch = () =>
          notes.forEach((name, i) => expect(name[0]).toBe(letterFor(notes[0], labels[i])));

        // Every written note sounds the right pitch
        notes.forEach((name, i) => expect(pcOfName(name)).toBe(mod12(keyToOffset(key) + pcs[i])));

        const expected = UNAVOIDABLE[pair];
        if (!expected) {
          expect(notes.filter(awkward)).toEqual([]);
          lettersMatch();
          return;
        }

        expect(notes.join(" ")).toBe(expected);
        if (keepsLetters) lettersMatch();
        else expect(notes.filter(awkward)).toEqual([]);
        // Listed only because no name of the tonic avoids it. (The chromatic's
        // labels are read off its own spelling, so its check is the spelling.)
        for (const tonic of TONIC_NAMES[key]) {
          const literal =
            scale === "chromatic" ? notes : literalSpelling(tonic, pcs, degreeNames(pcs));
          expect(literal.some(awkward)).toBe(true);
        }
      });
    }
  }

  it("lists only real scale-and-key pairs", () => {
    const pairs = new Set(
      (Object.keys(scales) as ScaleName[]).flatMap((scale) => KEYS.map((key) => `${key} ${scale}`))
    );
    for (const pair of Object.keys(UNAVOIDABLE)) expect(pairs.has(pair)).toBe(true);
  });
});
