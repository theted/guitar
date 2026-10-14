import { describe, expect, it } from "vitest";
import { phraseCoverage, phraseTurn } from "./phraseCoverage";
import type { PhraseEvent } from "./hooks/usePhraseEvents";

// Phrase events from pitches, or [pitch, string, fret] when fingered
const phrase = (...notes: Array<number | [number, number, number]>): PhraseEvent[] =>
  notes.map((note, index) => {
    const [abs, stringIndex, fret] = Array.isArray(note) ? note : [note];
    return { abs, index, startTimeSec: index * 0.2, durSec: 0.2, stringIndex, fret };
  });

// Two strings a fourth apart (open 0 and 5), as plain objects to compare
const TWO_STRINGS = [0, 5];
const asObjects = (coverage: ReturnType<typeof phraseCoverage>) =>
  coverage?.map((played) => Object.fromEntries([...played].sort(([a], [b]) => a - b)));

describe("phraseTurn", () => {
  it("turns at the top of a run that comes back down", () => {
    expect(phraseTurn(phrase(0, 2, 4, 5, 4, 2, 0))).toBe(3);
  });

  it("turns at the bottom of a run that starts at the top", () => {
    expect(phraseTurn(phrase(7, 5, 4, 2, 4, 5, 7))).toBe(3);
  });

  it("is the last note of a phrase that never comes back, and 0 for none", () => {
    expect(phraseTurn(phrase(0, 2, 4))).toBe(2);
    expect(phraseTurn([])).toBe(0);
  });
});

describe("phraseCoverage", () => {
  it("marks fingered frets by which way they're played; the turning note both", () => {
    // Up the low string to the top on the high one, back down by another route
    const fingered = phrase([0, 0, 0], [2, 0, 2], [4, 0, 4], [7, 1, 2], [5, 1, 0], [2, 0, 2], [0, 0, 0]);
    expect(asObjects(phraseCoverage(fingered, "fret", TWO_STRINGS, 7))).toEqual([
      { 0: "both", 2: "both", 4: "up" },
      { 0: "down", 2: "both" },
    ]);
  });

  it("lights a pitch wherever it is when the phrase isn't fingered", () => {
    // Up to 7 and down to 5: 7 is on both strings
    expect(asObjects(phraseCoverage(phrase(0, 4, 7, 5), "octave", TWO_STRINGS, 7))).toEqual([
      { 0: "up", 4: "up", 5: "down", 7: "both" },
      { 0: "down", 2: "both" },
    ]);
  });

  it("lights every octave of a pitch class in 'every octave' mode", () => {
    // Root and fifth: every C and G on one string, the turning fifth both ways
    expect(asObjects(phraseCoverage(phrase(0, 7), "all", [0], 24))).toEqual([
      { 0: "up", 7: "both", 12: "up", 19: "both", 24: "up" },
    ]);
  });

  it("follows the frets a fingered note is played on, not every place its pitch is", () => {
    // Pitch 5 is fret 5 on the low string too, but it's played on the high one
    expect(asObjects(phraseCoverage(phrase([5, 1, 0]), "octave", TWO_STRINGS, 7))).toEqual([
      {},
      { 0: "both" },
    ]);
  });

  it("has nothing to say about an empty phrase", () => {
    expect(phraseCoverage([], "fret", TWO_STRINGS, 7)).toBeNull();
  });
});
