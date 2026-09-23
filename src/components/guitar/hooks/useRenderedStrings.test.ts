import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useRenderedStrings } from "./useRenderedStrings";
import { getStringBaseNotes } from "@/theory/positions";
import { tunings } from "@/constants";

const standard = (strings: number) =>
  getStringBaseNotes(tunings.Standard, strings, 4);

describe("useRenderedStrings", () => {
  it("renders standard tuning high-to-low when the low string is at the bottom", () => {
    const { result } = renderHook(() =>
      useRenderedStrings({
        baseNotes: standard(6),
        lowAtBottom: true,
      })
    );

    expect(result.current.descriptors.map((string) => string.baseNote)).toEqual([
      0, -5, -9, -14, -19, -24,
    ]);
    expect(result.current.descriptors.map((string) => string.originalIndex)).toEqual([
      0, 1, 2, 3, 4, 5,
    ]);
    expect(result.current.descriptors[result.current.descriptors.length - 1].isBottom).toBe(true);
  });

  it("flips render order when the low string is placed at the top", () => {
    const { result } = renderHook(() =>
      useRenderedStrings({
        baseNotes: standard(6),
        lowAtBottom: false,
      })
    );

    expect(result.current.descriptors.map((string) => string.baseNote)).toEqual([
      -24, -19, -14, -9, -5, 0,
    ]);
    expect(result.current.descriptors.map((string) => string.originalIndex)).toEqual([
      5, 4, 3, 2, 1, 0,
    ]);
    expect(result.current.descriptors[result.current.descriptors.length - 1].baseNote).toBe(0);
    expect(result.current.descriptors[result.current.descriptors.length - 1].isBottom).toBe(true);
  });

  it("keeps low-index metadata tied to musical low-to-high order", () => {
    const { result } = renderHook(() =>
      useRenderedStrings({
        baseNotes: standard(8),
        lowAtBottom: true,
      })
    );

    expect(result.current.descriptors.map((string) => string.lowIndex)).toEqual([
      7, 6, 5, 4, 3, 2, 1, 0,
    ]);
    expect(result.current.descriptors.map((string) => string.baseNote)).toEqual([
      0, -5, -9, -14, -19, -24, -36, -41,
    ]);
  });
});
