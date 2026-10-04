import { describe, it, expect } from "vitest";
import { migrateFormState } from "./store";
import { DEFAULTS } from "./constants";

describe("migrateFormState", () => {
  it("resets removed scale names to the default", () => {
    expect(migrateFormState({ scale: "test" }).scale).toBe(DEFAULTS.SCALE);
    expect(migrateFormState({ scale: "weird" }).scale).toBe(DEFAULTS.SCALE);
  });

  it("keeps valid scales", () => {
    expect(migrateFormState({ scale: "harmonic minor" }).scale).toBe("harmonic minor");
  });

  it("renames legacy sharp keys to conventional flat names", () => {
    expect(migrateFormState({ tone: "a#" }).tone).toBe("bb");
    expect(migrateFormState({ tone: "d#" }).tone).toBe("eb");
    expect(migrateFormState({ tone: "g#" }).tone).toBe("ab");
    expect(migrateFormState({ tone: "c#" }).tone).toBe("db");
  });

  it("keeps keys that are still valid", () => {
    expect(migrateFormState({ tone: "f#" }).tone).toBe("f#");
    expect(migrateFormState({ tone: "e" }).tone).toBe("e");
  });

  it("falls back to the default key for unknown values", () => {
    expect(migrateFormState({ tone: "x" }).tone).toBe(DEFAULTS.KEY);
  });

  it("maps removed duplicate scales to their canonical names", () => {
    expect(migrateFormState({ scale: "gypsy" }).scale).toBe("double harmonic");
    expect(migrateFormState({ scale: "whole steps" }).scale).toBe("whole tone");
  });

  it("maps removed duplicate tunings to their canonical names", () => {
    expect(migrateFormState({ tuningName: "DADGBE" }).tuningName).toBe("Drop D");
    expect(migrateFormState({ tuningName: "DGDGBD" }).tuningName).toBe("Open G");
    expect(migrateFormState({ tuningName: "Nashville" }).tuningName).toBe("Standard");
    expect(migrateFormState({ tuningName: "Baritone B" }).tuningName).toBe("B Standard");
    expect(migrateFormState({ tuningName: "Baritone A" }).tuningName).toBe("A Standard");
  });

  it("falls back to the default tuning for unknown values", () => {
    expect(migrateFormState({ tuningName: "nonsense" }).tuningName).toBe(DEFAULTS.TUNING);
  });

  it("fills missing fields with defaults", () => {
    const migrated = migrateFormState({});
    expect(migrated.scale).toBe(DEFAULTS.SCALE);
    expect(migrated.tone).toBe(DEFAULTS.KEY);
    expect(migrated.bpm).toBeGreaterThan(0);
  });
});

describe("migrateFormState — v4", () => {
  it("carries 'once per tone' over to its clearer name", () => {
    expect(migrateFormState({ oncePerTone: true }).singleStringScale).toBe(true);
    expect(migrateFormState({ oncePerTone: false }).singleStringScale).toBe(false);
  });

  it("prefers an explicit new value over the old one", () => {
    const migrated = migrateFormState({ oncePerTone: true, singleStringScale: false });
    expect(migrated.singleStringScale).toBe(false);
  });

  it("drops settings that no longer exist", () => {
    const migrated = migrateFormState({ legendOnly: true, scheduleHorizon: 800 });
    expect(migrated).not.toHaveProperty("legendOnly");
    expect(migrated).not.toHaveProperty("scheduleHorizon");
  });

  it("defaults the master volume to audible and unmuted", () => {
    const migrated = migrateFormState({});
    expect(migrated.volume).toBeGreaterThan(0);
    expect(migrated.muted).toBe(false);
  });

  it("keeps a stored volume", () => {
    expect(migrateFormState({ volume: 25, muted: true }).volume).toBe(25);
    expect(migrateFormState({ volume: 25, muted: true }).muted).toBe(true);
  });
});

describe("migrateFormState — v5", () => {
  it("drops 'minimal highlight' and labels notes by name", () => {
    const migrated = migrateFormState({ minimalHighlight: true });
    expect(migrated).not.toHaveProperty("minimalHighlight");
    expect(migrated.labelMode).toBe("note");
  });

  it("keeps a stored label mode", () => {
    expect(migrateFormState({ labelMode: "interval" }).labelMode).toBe("interval");
  });
});

describe("migrateFormState — v6", () => {
  it("lights the played fret by default", () => {
    expect(migrateFormState({}).flashMode).toBe("fret");
    expect(migrateFormState({ octaveHighlight: false }).flashMode).toBe("fret");
  });

  it("keeps 'played octave only' as the octave flash mode", () => {
    const migrated = migrateFormState({ octaveHighlight: true });
    expect(migrated.flashMode).toBe("octave");
    expect(migrated).not.toHaveProperty("octaveHighlight");
  });
});

describe("migrateFormState — v7", () => {
  it("moves the old two-octaves-up default to real guitar pitch", () => {
    expect(migrateFormState({ startOctave: 6 }).startOctave).toBe(4);
  });

  it("keeps any other octave someone chose", () => {
    expect(migrateFormState({ startOctave: 3 }).startOctave).toBe(3);
    expect(migrateFormState({ startOctave: 5 }).startOctave).toBe(5);
  });

  it("keeps a stored sound, and starts new players on a steel-string guitar", () => {
    expect(migrateFormState({ soundType: "marimba" }).soundType).toBe("marimba");
    expect(migrateFormState({}).soundType).toBe("acoustic-steel");
  });
});

describe("sanitizeFormState", () => {
  it("replaces values the app can't use with defaults", async () => {
    const { sanitizeFormState } = await import("./store");
    const base = migrateFormState({});
    const clean = sanitizeFormState({
      ...base,
      phraseMode: "jazz-hands" as never,
      soundType: "theremin" as never,
      positionSpan: 9,
      strings: 40,
      frets: -3,
      bpm: Number.NaN,
      labelMode: "colours" as never,
      selectedPosition: 0,
      swing: "yes" as never,
    });
    expect(clean.phraseMode).toBe(base.phraseMode);
    expect(clean.soundType).toBe(base.soundType);
    expect(clean.positionSpan).toBe(5);
    expect(clean.strings).toBe(12);
    expect(clean.frets).toBe(1);
    expect(clean.bpm).toBe(base.bpm);
    expect(clean.labelMode).toBe("note");
    expect(clean.selectedPosition).toBeNull();
    expect(clean.swing).toBe(false);
  });

  it("keeps everything valid as it is", async () => {
    const { sanitizeFormState } = await import("./store");
    const state = { ...migrateFormState({}), phraseMode: "thirds" as const, soundType: "bass" as const, strings: 7, bpm: 120 };
    expect(sanitizeFormState(state)).toEqual(state);
  });
});
