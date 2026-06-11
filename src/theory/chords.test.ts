import { describe, it, expect } from "vitest";
import { getDiatonicChords } from "./chords";
import { intervalName } from "./intervals";
import { getScalePitchClasses } from "@/music";
import { scales } from "@/constants";

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

  it("returns nothing for non-heptatonic scales", () => {
    expect(chordsFor("e", "pentatonic")).toEqual([]);
    expect(chordsFor("c", "whole tone")).toEqual([]);
    expect(chordsFor("c", "chromatic")).toEqual([]);
  });

  it("never crashes on exotic heptatonic scales", () => {
    const exotics = ["arabian", "persian", "hungarian", "gypsy", "spanish"] as const;
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
