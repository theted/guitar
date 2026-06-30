import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setFormState, useFormStore } from "@/store";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

const press = (init: KeyboardEventInit, target: EventTarget = window) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, ...init }));
};

describe("useKeyboardShortcuts", () => {
  beforeEach(() => {
    setFormState({ bpm: 300 });
  });

  it("toggles playback with Space and stops with Escape", () => {
    const togglePlay = vi.fn();
    const stop = vi.fn();

    renderHook(() => useKeyboardShortcuts({ togglePlay, stop, panelOpen: false }));

    press({ code: "Space" });
    press({ key: "Escape" });

    expect(togglePlay).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it("does not stop on Escape while the settings panel is open", () => {
    const stop = vi.fn();

    renderHook(() => useKeyboardShortcuts({ togglePlay: vi.fn(), stop, panelOpen: true }));

    press({ key: "Escape" });

    expect(stop).not.toHaveBeenCalled();
  });

  it("adjusts BPM with arrow keys and clamps to supported bounds", () => {
    renderHook(() => useKeyboardShortcuts({ togglePlay: vi.fn(), stop: vi.fn(), panelOpen: false }));

    press({ key: "ArrowUp" });
    expect(useFormStore.getState().bpm).toBe(305);

    setFormState({ bpm: 30 });
    press({ key: "ArrowDown" });
    expect(useFormStore.getState().bpm).toBe(30);

    setFormState({ bpm: 700 });
    press({ key: "ArrowUp" });
    expect(useFormStore.getState().bpm).toBe(700);
  });

  it("ignores modified shortcuts and keyboard events from interactive targets", () => {
    const togglePlay = vi.fn();
    const stop = vi.fn();
    const input = document.createElement("input");
    document.body.appendChild(input);

    renderHook(() => useKeyboardShortcuts({ togglePlay, stop, panelOpen: false }));

    press({ code: "Space", ctrlKey: true });
    press({ code: "Space" }, input);
    press({ key: "Escape" }, input);

    expect(togglePlay).not.toHaveBeenCalled();
    expect(stop).not.toHaveBeenCalled();
  });
});
