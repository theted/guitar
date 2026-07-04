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
