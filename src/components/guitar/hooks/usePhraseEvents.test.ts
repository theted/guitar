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

  it("lasts exactly one beat per note, so a loop restarts on the beat", () => {
    for (const stepMs of [86, 200, 600]) {
      const { events, loopDuration } = renderEvents({ stepMs, loop: true });
      // The next pass starts where the next note would have: no gap
      expect(loopDuration).toBeCloseTo((events.length * stepMs) / 1000, 6);
    }
  });

  it("keeps the swing feel across the turnaround", () => {
    const { events, loopDuration } = renderEvents({ swing: true, loop: true });
    const total = events.slice(1).reduce((sum, e, i) => sum + (e.startTimeSec - events[i].startTimeSec), 0);
    const lastStep = loopDuration - total;
    // The last note gets its own swung step, not its ringing duration
    expect([0.2 * 4 / 3, 0.2 * 2 / 3].some((step) => Math.abs(step - lastStep) < 1e-6)).toBe(true);
  });

  it("doesn't play the tonic twice at the turnaround of a descending loop", () => {
    const once = renderEvents({ loop: false }).events;
    const looped = renderEvents({ loop: true }).events;
    expect(once[0].abs).toBe(once[once.length - 1].abs);
    expect(looped).toHaveLength(once.length - 1);
    expect(looped[looped.length - 1].abs).not.toBe(looped[0].abs);
  });

  it("keeps every note of a loop that doesn't come back to its start", () => {
    const once = renderEvents({ descend: false, loop: false }).events;
    expect(renderEvents({ descend: false, loop: true }).events).toHaveLength(once.length);
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
