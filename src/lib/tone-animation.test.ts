import { describe, it, expect, vi, beforeEach } from "vitest";
import { toneAnimationManager } from "./tone-animation";

// jsdom has no Web Animations API; record calls per overlay element
const animateMock = vi.fn(function (this: HTMLElement) {
  return { cancel: vi.fn(), onfinish: null as (() => void) | null };
});

// The manager is a singleton; unregister everything between tests like
// components do on unmount.
const registered: HTMLElement[] = [];

const makeFret = (abs: number): HTMLElement => {
  const el = document.createElement("div");
  const overlay = document.createElement("span");
  overlay.className = "tone-overlay";
  el.appendChild(overlay);
  document.body.appendChild(el);
  toneAnimationManager.applyToneClass(el, abs);
  registered.push(el);
  return el;
};

beforeEach(() => {
  registered.splice(0).forEach((el) => toneAnimationManager.clearToneClass(el));
  document.body.innerHTML = "";
  animateMock.mockClear();
  Element.prototype.animate = animateMock as unknown as typeof Element.prototype.animate;
});

describe("toneAnimationManager", () => {
  it("flashes all octaves of a pitch class in pitch-class mode", () => {
    toneAnimationManager.setMode("pitch-class");
    makeFret(0);   // E4
    makeFret(12);  // E5
    makeFret(1);   // F4 — different pitch class
    toneAnimationManager.flashTone(0, 500);
    expect(animateMock).toHaveBeenCalledTimes(2);
  });

  it("flashes only the exact octave in octave-specific mode", () => {
    toneAnimationManager.setMode("octave-specific");
    makeFret(0);   // E4
    makeFret(12);  // E5
    toneAnimationManager.flashTone(0, 500);
    expect(animateMock).toHaveBeenCalledTimes(1);
  });

  it("stops flashing unregistered elements", () => {
    toneAnimationManager.setMode("pitch-class");
    const el = makeFret(0);
    toneAnimationManager.clearToneClass(el);
    toneAnimationManager.flashTone(0, 500);
    expect(animateMock).not.toHaveBeenCalled();
  });

  it("re-registers an element when its semitone changes", () => {
    toneAnimationManager.setMode("pitch-class");
    const el = makeFret(0);
    toneAnimationManager.applyToneClass(el, 3); // moved to G4
    toneAnimationManager.flashTone(0, 500);
    expect(animateMock).not.toHaveBeenCalled();
    toneAnimationManager.flashTone(3, 500);
    expect(animateMock).toHaveBeenCalledTimes(1);
  });

  it("handles negative semitones via pitch-class wrapping", () => {
    toneAnimationManager.setMode("pitch-class");
    makeFret(-12); // E3
    toneAnimationManager.flashTone(0, 500); // E in any octave
    expect(animateMock).toHaveBeenCalledTimes(1);
  });
});
