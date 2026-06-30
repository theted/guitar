import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { scheduler, type PlaybackEvent } from "./scheduler";

const audio = vi.hoisted(() => ({
  currentTime: 0,
  playSemitoneAt: vi.fn(),
}));

vi.mock("./audio", () => ({
  getCurrentTime: () => audio.currentTime,
  playSemitoneAt: audio.playSemitoneAt,
}));

const events = (...items: PlaybackEvent[]) => items;

describe("AudioScheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    audio.currentTime = 0;
    audio.playSemitoneAt.mockReset();
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) =>
      window.setTimeout(() => callback(audio.currentTime * 1000), 16) as unknown as number
    );
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation((handle) => {
      window.clearTimeout(handle);
    });
  });

  afterEach(() => {
    scheduler.stopAll();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("schedules phrase audio only inside the rolling lookahead window", () => {
    audio.currentTime = 10;

    scheduler.startPhraseSession(
      events(
        { abs: 0, startTimeSec: 10.0, durSec: 0.1 },
        { abs: 2, startTimeSec: 10.1, durSec: 0.1 },
        { abs: 4, startTimeSec: 10.2, durSec: 0.1 }
      ),
      vi.fn(),
      "sine"
    );

    expect(audio.playSemitoneAt).toHaveBeenCalledTimes(2);
    expect(audio.playSemitoneAt).toHaveBeenNthCalledWith(1, 0, 10.0, {
      duration: 0.2,
      type: "sine",
    });
    expect(audio.playSemitoneAt).toHaveBeenNthCalledWith(2, 2, 10.1, {
      duration: 0.2,
      type: "sine",
    });

    audio.currentTime = 10.1;
    vi.advanceTimersByTime(25);

    expect(audio.playSemitoneAt).toHaveBeenCalledTimes(3);
    expect(audio.playSemitoneAt).toHaveBeenLastCalledWith(4, 10.2, {
      duration: 0.2,
      type: "sine",
    });
  });

  it("skips stale phrase audio instead of scheduling catch-up bursts", () => {
    audio.currentTime = 10;

    scheduler.startPhraseSession(
      events(
        { abs: 0, startTimeSec: 9.4, durSec: 0.2 },
        { abs: 2, startTimeSec: 9.6, durSec: 0.2 },
        { abs: 4, startTimeSec: 10.1, durSec: 0.2 }
      ),
      vi.fn(),
      "sine"
    );

    expect(audio.playSemitoneAt).toHaveBeenCalledTimes(2);
    expect(audio.playSemitoneAt.mock.calls.map(([abs]) => abs)).toEqual([2, 4]);
  });

  it("fires phrase UI callbacks when events enter the rAF timing window", () => {
    audio.currentTime = 5;
    const onUiNote = vi.fn();
    const event = { abs: 7, startTimeSec: 5.003, durSec: 0.25, stringIndex: 2, fret: 4 };

    scheduler.startPhraseSession(events(event), onUiNote, "sine");

    expect(onUiNote).toHaveBeenCalledWith(7, 250, event);
  });

  it("triggerNow schedules a single note after the audio lookahead", () => {
    audio.currentTime = 2;
    const onUiNote = vi.fn();

    scheduler.triggerNow(5, 120, "sine", onUiNote);

    expect(audio.playSemitoneAt).toHaveBeenCalledWith(5, 2.03, {
      duration: 0.2,
      type: "sine",
    });

    audio.currentTime = 2.03;
    vi.advanceTimersByTime(16);

    expect(onUiNote).toHaveBeenCalledWith(5, 120);
  });
});
