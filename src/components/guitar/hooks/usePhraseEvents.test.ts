import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePhraseEvents } from "./usePhraseEvents";
import { getScalePitchClasses } from "@/music";
import { scales } from "@/constants";

const renderEvents = (overrides: Partial<Parameters<typeof usePhraseEvents>[0]> = {}) =>
  renderHook(() =>
    usePhraseEvents({
      pitchClasses: getScalePitchClasses(scales.major),
      mode: "full-scale",
      octaves: 2,
      descend: true,
      stepMs: 200,
      swing: false,
      rootAbs: 0,
      ...overrides,
    })
  ).result.current;

describe("usePhraseEvents timing", () => {
  it("produces strictly increasing start times with positive durations", () => {
    const { events } = renderEvents();
    expect(events.length).toBeGreaterThan(0);
    for (let i = 0; i < events.length; i += 1) {
      expect(events[i].durSec).toBeGreaterThan(0);
      if (i > 0) expect(events[i].startTimeSec).toBeGreaterThan(events[i - 1].startTimeSec);
    }
  });

  it("spans the loop duration exactly to the last event's end", () => {
    const { events, loopDuration } = renderEvents();
    const last = events[events.length - 1];
    expect(loopDuration).toBeCloseTo(last.startTimeSec + last.durSec, 6);
  });

  it("swing alternates long and short steps in a 2:1 feel", () => {
    const { events } = renderEvents({ swing: true });
    const gaps = events.slice(1).map((e, i) => e.startTimeSec - events[i].startTimeSec);
    // long (4/3 step) then short (2/3 step), repeating
    for (let i = 0; i + 1 < gaps.length; i += 2) {
      expect(gaps[i]).toBeCloseTo(gaps[i + 1] * 2, 6);
    }
  });

  it("starts every event from the phrase root", () => {
    const { events } = renderEvents({ rootAbs: 5, octaves: 1, descend: false });
    expect(events[0].abs).toBe(5);
    expect(events.every((e) => e.abs >= 5)).toBe(true);
  });

  it("follows the root wherever the fretboard puts it", () => {
    // Same phrase, two octaves apart: every note shifts by exactly 24
    const low = renderEvents({ rootAbs: -12, octaves: 2 }).events;
    const high = renderEvents({ rootAbs: 12, octaves: 2 }).events;
    expect(low.length).toBe(high.length);
    low.forEach((event, i) => expect(high[i].abs - event.abs).toBe(24));
  });

  it("numbers the events in sequence order", () => {
    const { events } = renderEvents();
    events.forEach((event, i) => expect(event.index).toBe(i));
  });
});
