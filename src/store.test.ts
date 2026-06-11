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

  it("fills missing fields with defaults", () => {
    const migrated = migrateFormState({});
    expect(migrated.scale).toBe(DEFAULTS.SCALE);
    expect(migrated.tone).toBe(DEFAULTS.KEY);
    expect(migrated.bpm).toBeGreaterThan(0);
  });
});
