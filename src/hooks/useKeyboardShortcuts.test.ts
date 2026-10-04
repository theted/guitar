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

  it("steps through the keys chromatically with ← and →, wrapping around", () => {
    renderHook(() => useKeyboardShortcuts({ togglePlay: vi.fn(), stop: vi.fn(), panelOpen: false }));
    setFormState({ tone: "e" });
    press({ key: "ArrowRight" });
    expect(useFormStore.getState().tone).toBe("f");
    press({ key: "ArrowLeft" });
    press({ key: "ArrowLeft" });
    expect(useFormStore.getState().tone).toBe("eb");
    setFormState({ tone: "b" });
    press({ key: "ArrowRight" });
    expect(useFormStore.getState().tone).toBe("c");
  });

  it("changes tempo without stopping playback", () => {
    const stop = vi.fn();
    renderHook(() => useKeyboardShortcuts({ togglePlay: vi.fn(), stop, panelOpen: false }));
    press({ key: "ArrowUp" });
    press({ key: "ArrowDown" });
    expect(stop).not.toHaveBeenCalled();
  });

  describe("on a focused control", () => {
    // jsdom can't tell how focus arrived; stand in for :focus-visible
    const focusVia = (element: HTMLElement, how: "mouse" | "keyboard") => {
      const original = element.matches.bind(element);
      element.matches = (selector: string) =>
        selector === ":focus-visible" ? how === "keyboard" : original(selector);
      document.body.appendChild(element);
      element.focus();
      return element;
    };

    it("plays on Space after a button was clicked, without clicking it again", () => {
      const togglePlay = vi.fn();
      renderHook(() => useKeyboardShortcuts({ togglePlay, stop: vi.fn(), panelOpen: false }));
      const button = focusVia(document.createElement("button"), "mouse");
      const keyup = new KeyboardEvent("keyup", { code: "Space", bubbles: true, cancelable: true });
      press({ code: "Space", cancelable: true }, button);
      button.dispatchEvent(keyup);
      expect(togglePlay).toHaveBeenCalledTimes(1);
      expect(keyup.defaultPrevented).toBe(true);
    });

    it("leaves Space to a button reached with the keyboard", () => {
      const togglePlay = vi.fn();
      renderHook(() => useKeyboardShortcuts({ togglePlay, stop: vi.fn(), panelOpen: false }));
      press({ code: "Space" }, focusVia(document.createElement("button"), "keyboard"));
      expect(togglePlay).not.toHaveBeenCalled();
    });

    it("leaves arrows to a keyboard-focused radio group, but not a clicked one", () => {
      renderHook(() => useKeyboardShortcuts({ togglePlay: vi.fn(), stop: vi.fn(), panelOpen: false }));
      const radio = document.createElement("button");
      radio.setAttribute("role", "radio");
      press({ key: "ArrowUp" }, focusVia(radio, "keyboard"));
      expect(useFormStore.getState().bpm).toBe(300);
      press({ key: "ArrowUp" }, focusVia(radio.cloneNode() as HTMLElement, "mouse"));
      expect(useFormStore.getState().bpm).toBe(305);
    });

    it("leaves arrows and Space to a fret reached with the keyboard", () => {
      const togglePlay = vi.fn();
      renderHook(() => useKeyboardShortcuts({ togglePlay, stop: vi.fn(), panelOpen: false }));
      const fret = document.createElement("div");
      fret.setAttribute("role", "gridcell");
      fret.tabIndex = 0;
      focusVia(fret, "keyboard");
      press({ key: "ArrowUp" }, fret);
      press({ code: "Space" }, fret);
      expect(useFormStore.getState().bpm).toBe(300);
      expect(togglePlay).not.toHaveBeenCalled();
    });

    it("stops on Escape from anywhere but a text field", () => {
      const stop = vi.fn();
      renderHook(() => useKeyboardShortcuts({ togglePlay: vi.fn(), stop, panelOpen: false }));
      press({ key: "Escape" }, focusVia(document.createElement("button"), "keyboard"));
      expect(stop).toHaveBeenCalledTimes(1);
    });
  });

  it("toggles once for a held Space", () => {
    const togglePlay = vi.fn();
    renderHook(() => useKeyboardShortcuts({ togglePlay, stop: vi.fn(), panelOpen: false }));
    press({ code: "Space" });
    press({ code: "Space", repeat: true });
    press({ code: "Space", repeat: true });
    expect(togglePlay).toHaveBeenCalledTimes(1);
  });

  it("leaves an open picker's keys alone", () => {
    const togglePlay = vi.fn();
    renderHook(() => useKeyboardShortcuts({ togglePlay, stop: vi.fn(), panelOpen: false }));
    const listbox = document.createElement("div");
    listbox.setAttribute("role", "listbox");
    const option = document.createElement("div");
    listbox.appendChild(option);
    document.body.appendChild(listbox);
    press({ code: "Space" }, option);
    press({ key: "ArrowDown" }, option);
    expect(togglePlay).not.toHaveBeenCalled();
    expect(useFormStore.getState().bpm).toBe(300);
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
