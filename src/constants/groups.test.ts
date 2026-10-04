import { describe, it, expect } from "vitest";
import { scales, SCALE_GROUPS } from "./scales";
import { tunings, TUNING_GROUPS } from "./tunings";

// The pickers render only what the group metadata lists, so a catalog entry
// missing from its groups would be unselectable (and a stale entry would crash
// the picker). Guard the two stay in sync.
describe("picker group metadata", () => {
  it("SCALE_GROUPS covers every scale exactly once", () => {
    const grouped = SCALE_GROUPS.flatMap((group) => group.scales.map((s) => s.value));
    expect([...grouped].sort()).toEqual(Object.keys(scales).sort());
    expect(new Set(grouped).size).toBe(grouped.length);
  });

  it("TUNING_GROUPS covers every tuning exactly once", () => {
    const grouped = TUNING_GROUPS.flatMap((group) => group.tunings);
    expect([...grouped].sort()).toEqual(Object.keys(tunings).sort());
    expect(new Set(grouped).size).toBe(grouped.length);
  });
});

describe("concert pitch", () => {
  it("puts guitars at octave 4 and basses an octave lower", async () => {
    const { concertOctave } = await import("./tunings");
    expect(concertOctave("Standard")).toBe(4);
    expect(concertOctave("7-String Standard")).toBe(4);
    expect(concertOctave("Bass Standard")).toBe(2);
    expect(concertOctave("Bass Drop D")).toBe(2);
  });
});
