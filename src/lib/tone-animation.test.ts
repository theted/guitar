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

  it("keeps flashing anyOctave elements in octave-specific mode", () => {
    // The scale legend stands for a degree, not a pitch: it must light up for
    // its tone whatever octave the phrase is playing in.
    const makeLegendChip = (abs: number) => {
      const el = document.createElement("div");
      const overlay = document.createElement("span");
      overlay.className = "tone-overlay";
      el.appendChild(overlay);
      document.body.appendChild(el);
      toneAnimationManager.applyToneClass(el, abs, { anyOctave: true });
      registered.push(el);
      return el;
    };

    toneAnimationManager.setMode("octave-specific");
    makeLegendChip(0); // legend chip for E, registered at the E4 origin
    makeFret(24); // E6 on the neck

    toneAnimationManager.flashTone(24, 500);
    expect(animateMock).toHaveBeenCalledTimes(2); // the fret and the legend chip

    // …and it still flashes only once when both live in the same octave
    animateMock.mockClear();
    toneAnimationManager.flashTone(0, 500);
    expect(animateMock).toHaveBeenCalledTimes(1);
  });

  it("flashes phrase steps by position, not by pitch", () => {
    const makeStep = (index: number) => {
      const el = document.createElement("div");
      const overlay = document.createElement("span");
      overlay.className = "tone-overlay";
      el.appendChild(overlay);
      document.body.appendChild(el);
      toneAnimationManager.registerStep(el, index);
      return el;
    };

    const first = makeStep(0);
    makeStep(1);

    toneAnimationManager.flashStep(1, 500);
    expect(animateMock).toHaveBeenCalledTimes(1);

    toneAnimationManager.flashStep(7, 500); // no such step: no-op
    expect(animateMock).toHaveBeenCalledTimes(1);

    toneAnimationManager.clearStep(first);
    toneAnimationManager.flashStep(0, 500);
    expect(animateMock).toHaveBeenCalledTimes(1);
  });

  it("flashAt flashes exactly one registered fret location", () => {
    const makeFretAt = (abs: number, stringIndex: number, fret: number) => {
      const el = document.createElement("div");
      const overlay = document.createElement("span");
      overlay.className = "tone-overlay";
      el.appendChild(overlay);
      document.body.appendChild(el);
      toneAnimationManager.applyToneClass(el, abs, { fret: { stringIndex, fret } });
      registered.push(el);
      return el;
    };
    // Same pitch (E3) reachable on two strings — only the targeted one flashes
    makeFretAt(-12, 0, 12);
    makeFretAt(-12, 1, 7);
    toneAnimationManager.flashAt(1, 7, 500);
    expect(animateMock).toHaveBeenCalledTimes(1);
    toneAnimationManager.flashAt(3, 3, 500); // unregistered location: no-op
    expect(animateMock).toHaveBeenCalledTimes(1);
  });
});
