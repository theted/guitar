import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useStringNotes } from "./useStringNotes";
import { selectChord } from "./useSelectedChord";

const renderStringNotes = (
  overrides: Partial<Parameters<typeof useStringNotes>[0]> = {}
) =>
  renderHook(() =>
    useStringNotes({
      note: 0,
      frets: 3,
      scale: "major",
      keyy: "e",
      highlightEnabled: true,
      lowestStringOnly: false,
      isLowest: true,
      ...overrides,
    })
  ).result.current;

describe("useStringNotes", () => {
  it("describes frets with absolute notes, labels and scale degrees", () => {
    const notes = renderStringNotes({ frets: 4, scale: "major", keyy: "e" });

    expect(notes.map((note) => note.label)).toEqual(["E4", "F4", "F#4", "G4", "G#4"]);
    expect(notes.map((note) => note.actualNote)).toEqual([0, 1, 2, 3, 4]);
    expect(notes.map((note) => note.degree)).toEqual([1, null, 2, null, 3]);
    expect(notes[0]).toMatchObject({
      fret: 0,
      relativePc: 0,
      isSelected: true,
      isBase: true,
      showScaleHighlight: true,
    });
  });

  it("uses the scale spelling map for flat keys", () => {
    const notes = renderStringNotes({
      note: 5,
      frets: 1,
      scale: "major",
      keyy: "f",
    });

    expect(notes.map((note) => note.label)).toEqual(["A4", "Bb4"]);
    expect(notes[1]).toMatchObject({
      relativePc: 5,
      isSelected: true,
      degree: 4,
    });
  });

  it("suppresses scale highlights above the bottom string when requested", () => {
    const notes = renderStringNotes({
      lowestStringOnly: true,
      isLowest: false,
    });

    expect(notes[0].isSelected).toBe(true);
    expect(notes[0].showScaleHighlight).toBe(false);
  });

  it("drops every scale highlight when highlighting is off", () => {
    const notes = renderStringNotes({ frets: 4, highlightEnabled: false });

    // The theory is unchanged — only the marking on the neck goes away
    expect(notes.map((note) => note.showScaleHighlight)).toEqual([false, false, false, false, false]);
    expect(notes[0].isSelected).toBe(true);
    expect(notes[0].degree).toBe(1);
  });

  it("marks selected chord tones and the chord root", () => {
    const notes = renderStringNotes({
      note: 8,
      frets: 7,
      scale: "major",
      keyy: "c",
      chord: selectChord("c", "major", 1, false),
    });

    expect(notes[0]).toMatchObject({ label: "C5", chordTone: true, isChordRoot: true });
    expect(notes[2]).toMatchObject({ label: "D5", chordTone: false, isChordRoot: false });
    expect(notes[4]).toMatchObject({ label: "E5", chordTone: true, isChordRoot: false });
    expect(notes[7]).toMatchObject({ label: "G5", chordTone: true, isChordRoot: false });
  });

  it("adds the 7th and names every scale note from the chord's root", () => {
    // C major's ii7 is Dm7 (D F A C); E, G and B are its 9th, 11th and 13th.
    // C string, frets 0–11: C C# D D# E F F# G G# A A# B
    const notes = renderStringNotes({
      note: 8,
      frets: 11,
      scale: "major",
      keyy: "c",
      chord: selectChord("c", "major", 2, true),
    });

    expect(notes.map((note) => note.chordTone)).toEqual([
      true, false, true, false, false, true, false, false, false, true, false, false,
    ]);
    expect(notes.map((note) => note.isChordRoot)).toEqual([
      false, false, true, false, false, false, false, false, false, false, false, false,
    ]);
    expect(notes.map((note) => note.chordLabel)).toEqual([
      "♭7", null, "R", null, "9", "♭3", null, "11", null, "5", null, "13",
    ]);
  });

  it("tracks active position membership by fret", () => {
    const notes = renderStringNotes({
      frets: 3,
      positionFrets: new Set([0, 2]),
    });

    expect(notes.map((note) => note.inPosition)).toEqual([true, false, true, false]);
  });

  it("says which way through the phrase each fret is played", () => {
    const notes = renderStringNotes({
      frets: 3,
      playedFrets: new Map([[0, "up"], [3, "both"]]),
    });

    expect(notes.map((note) => note.played)).toEqual(["up", "none", "none", "both"]);
  });

  it("leaves chord and position metadata null when those features are inactive", () => {
    const notes = renderStringNotes();

    expect(notes[0].chordTone).toBeNull();
    expect(notes[0].chordLabel).toBeNull();
    expect(notes[0].inPosition).toBeNull();
    expect(notes[0].played).toBeNull();
  });
});
