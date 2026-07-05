import { describe, it, expect } from "vitest";
import { RIFFS } from "./riffs";
import { scales, type ScaleName } from "./scales";
import { getScalePitchClasses } from "@/music";

// A riff exists to demonstrate its scale, so every sounded note must be a
// scale tone — this is the contract that keeps the catalog honest.
describe("riff catalog", () => {
  const entries = Object.entries(RIFFS) as Array<[ScaleName, NonNullable<typeof RIFFS[ScaleName]>]>;

  it("has at least one riff", () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it("only sounds notes belonging to the riff's scale", () => {
    for (const [scaleName, riffs] of entries) {
      const pcs = new Set<number>(getScalePitchClasses(scales[scaleName]));
      for (const riff of riffs) {
        for (const step of riff.steps) {
          if (step.rel == null) continue;
          const pc = ((step.rel % 12) + 12) % 12;
          expect(pcs.has(pc), `${riff.id}: rel ${step.rel} (pc ${pc}) is not in ${scaleName}`).toBe(true);
        }
      }
    }
  });

  it("uses positive durations everywhere", () => {
    for (const [, riffs] of entries) {
      for (const riff of riffs) {
        expect(riff.steps.length).toBeGreaterThan(0);
        for (const step of riff.steps) {
          expect(step.beats).toBeGreaterThan(0);
        }
      }
    }
  });

  it("suggests a tempo within the BPM slider's range", () => {
    for (const [, riffs] of entries) {
      for (const riff of riffs) {
        expect(riff.bpm).toBeGreaterThanOrEqual(30);
        expect(riff.bpm).toBeLessThanOrEqual(700);
      }
    }
  });

  it("has globally unique ids and non-empty names", () => {
    const ids = entries.flatMap(([, riffs]) => riffs.map((riff) => riff.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const [, riffs] of entries) {
      for (const riff of riffs) {
        expect(riff.name.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps every riff within a playable two-octave range", () => {
    for (const [, riffs] of entries) {
      for (const riff of riffs) {
        for (const step of riff.steps) {
          if (step.rel == null) continue;
          expect(step.rel).toBeGreaterThanOrEqual(0);
          expect(step.rel).toBeLessThanOrEqual(24);
        }
      }
    }
  });
});
