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
      keyOffset: 0,
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

  it("offsets all events by the key", () => {
    const { events } = renderEvents({ keyOffset: 5, octaves: 1, descend: false });
    expect(events[0].abs).toBe(5);
    expect(events.every((e) => e.abs >= 5)).toBe(true);
  });
});

describe("usePhraseEvents riff mode", () => {
  const riff = {
    id: "test-riff",
    name: "Test riff",
    bpm: 300,
    steps: [
      { rel: 0, beats: 1 },
      { rel: null, beats: 0.5 }, // rest
      { rel: 7, beats: 2 },
      { rel: null, beats: 1 }, // trailing rest
    ],
  };

  it("plays the riff's own rhythm, skipping rests", () => {
    const { events } = renderEvents({ riff, keyOffset: 3, stepMs: 200 });
    expect(events).toHaveLength(2);
    expect(events[0].abs).toBe(3);
    expect(events[0].startTimeSec).toBeCloseTo(0, 6);
    // The 7-semitone note starts after 1 beat of sound + 0.5 beats of rest
    expect(events[1].abs).toBe(10);
    expect(events[1].startTimeSec).toBeCloseTo(0.3, 6);
    expect(events[1].durSec).toBeCloseTo(0.44, 6);
  });

  it("includes trailing rests in the loop duration", () => {
    const { loopDuration } = renderEvents({ riff, stepMs: 200 });
    expect(loopDuration).toBeCloseTo(0.9, 6); // (1 + 0.5 + 2 + 1) × 0.2s
  });

  it("ignores swing so the authored rhythm is preserved", () => {
    const straight = renderEvents({ riff, stepMs: 200, swing: false });
    const swung = renderEvents({ riff, stepMs: 200, swing: true });
    expect(swung.events).toEqual(straight.events);
  });
});
