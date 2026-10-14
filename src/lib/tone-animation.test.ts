import { describe, it, expect, vi, beforeEach } from "vitest";
import { toneAnimationManager, flashKeyframes, cueKeyframes } from "./tone-animation";

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

  it("flashAt also lights the legend entry for that pitch class", () => {
    const fret = document.createElement("div");
    fret.innerHTML = '<span class="tone-overlay"></span>';
    const legend = document.createElement("div");
    legend.innerHTML = '<span class="tone-overlay"></span>';
    document.body.append(fret, legend);
    registered.push(fret, legend);
    toneAnimationManager.applyToneClass(fret, -12, { fret: { stringIndex: 0, fret: 12 } });
    toneAnimationManager.applyToneClass(legend, 0, { anyOctave: true }); // E, any octave
    toneAnimationManager.flashAt(0, 12, 500);
    expect(animateMock).toHaveBeenCalledTimes(2);
  });
});

describe("flashKeyframes", () => {
  const offsets = (frames: Keyframe[]) => frames.map((f) => f.offset);
  const opacities = (frames: Keyframe[]) => frames.map((f) => f.opacity);

  it("keeps the played note at full strength for its step, then leaves a dim trail", () => {
    // 1.2 s of glow, 100 ms step (600 bpm)
    const frames = flashKeyframes(1200, 100, false);
    expect(offsets(frames)).toEqual([0, 0.0833, 0.1333, 1]);
    expect(opacities(frames)).toEqual([1, 1, 0.35, 0]);
  });

  it("pops a fret in and shrinks it into the trail", () => {
    const frames = flashKeyframes(1200, 300, true);
    expect(offsets(frames)).toEqual([0, 0.1, 0.25, 0.3, 1]);
    expect(frames.map((f) => f.transform)).toEqual([
      "translateZ(0) scale(1.3)",
      "translateZ(0) scale(1)",
      "translateZ(0) scale(1)",
      "translateZ(0) scale(0.7)",
      "translateZ(0) scale(0.7)",
    ]);
  });

  it("only changes brightness without pop", () => {
    expect(flashKeyframes(1200, 300, false).every((f) => f.transform === "translateZ(0)")).toBe(true);
  });

  it("fades the played note out when there's no time left for a trail", () => {
    // Reduced animations: the glow lasts as long as the note sounds
    const frames = flashKeyframes(240, 200, false);
    expect(offsets(frames)).toEqual([0, 0.5, 0.8333, 1]);
    expect(opacities(frames)).toEqual([1, 1, 1, 0]);
  });
});

describe("flash hold", () => {
  it("passes the step length through to the fret's animation", () => {
    const fret = document.createElement("div");
    fret.innerHTML = '<span class="tone-overlay"></span>';
    document.body.append(fret);
    registered.push(fret);
    toneAnimationManager.applyToneClass(fret, 0, { fret: { stringIndex: 5, fret: 0 } });
    toneAnimationManager.flashAt(5, 0, 1200, 100);
    const [keyframes, options] = animateMock.mock.calls[0] as unknown as [Keyframe[], KeyframeAnimationOptions];
    expect(options.duration).toBe(1200);
    expect(keyframes).toEqual(flashKeyframes(1200, 100, true));
  });

  it("drops the pop when motion is reduced", () => {
    const fret = document.createElement("div");
    fret.innerHTML = '<span class="tone-overlay"></span>';
    document.body.append(fret);
    registered.push(fret);
    toneAnimationManager.applyToneClass(fret, 0, { fret: { stringIndex: 5, fret: 0 } });
    toneAnimationManager.setReducedMotion(true);
    toneAnimationManager.flashAt(5, 0, 1200, 100);
    toneAnimationManager.setReducedMotion(false);
    const [keyframes] = animateMock.mock.calls[0] as unknown as [Keyframe[]];
    expect(keyframes).toEqual(flashKeyframes(1200, 100, false));
  });
});

describe("next-note cue", () => {
  // A fret (or step) with both children, as the components render them
  const withCue = (): HTMLElement => {
    const el = document.createElement("div");
    el.innerHTML = '<span class="tone-overlay"></span><span class="tone-cue"></span>';
    document.body.append(el);
    registered.push(el);
    return el;
  };
  const animated = () => animateMock.mock.contexts as HTMLElement[];

  it("closes a ring in on the note, landing as it plays", () => {
    expect(cueKeyframes(true)).toEqual([
      { offset: 0, opacity: 0, transform: "translateZ(0) scale(1.8)" },
      { offset: 0.25, opacity: 0.6, transform: "translateZ(0) scale(1.6)" },
      { offset: 1, opacity: 1, transform: "translateZ(0) scale(1)" },
    ]);
  });

  it("just fades in without motion", () => {
    expect(cueKeyframes(false).map((f) => [f.offset, f.opacity])).toEqual([[0, 0], [0.15, 0.8], [1, 0.8]]);
    expect(cueKeyframes(false).every((f) => f.transform === "translateZ(0)")).toBe(true);
  });

  it("cueAt animates the targeted fret's cue, not its glow", () => {
    const fret = withCue();
    toneAnimationManager.applyToneClass(fret, 0, { fret: { stringIndex: 5, fret: 0 } });
    toneAnimationManager.cueAt(5, 0, 200);
    expect(animated()).toEqual([fret.querySelector(".tone-cue")]);
    const [keyframes, options] = animateMock.mock.calls[0] as unknown as [Keyframe[], KeyframeAnimationOptions];
    expect(keyframes).toEqual(cueKeyframes(true));
    expect(options.duration).toBe(200);
  });

  it("cueTone follows the mode, and leaves out elements without a cue", () => {
    const legend = document.createElement("div");
    legend.innerHTML = '<span class="tone-overlay"></span>';
    document.body.append(legend);
    registered.push(legend);
    toneAnimationManager.applyToneClass(legend, 0, { anyOctave: true });
    const e4 = withCue();
    toneAnimationManager.applyToneClass(e4, 0);
    const e5 = withCue();
    toneAnimationManager.applyToneClass(e5, 12);

    toneAnimationManager.setMode("octave-specific");
    toneAnimationManager.cueTone(0, 200);
    expect(animated()).toEqual([e4.querySelector(".tone-cue")]);

    animateMock.mockClear();
    toneAnimationManager.setMode("pitch-class");
    toneAnimationManager.cueTone(0, 200);
    expect(animated()).toEqual([e4.querySelector(".tone-cue"), e5.querySelector(".tone-cue")]);
  });

  it("cueStep marks a phrase step without moving it", () => {
    const step = withCue();
    toneAnimationManager.registerStep(step, 3);
    toneAnimationManager.cueStep(3, 200);
    expect(animated()).toEqual([step.querySelector(".tone-cue")]);
    const [keyframes] = animateMock.mock.calls[0] as unknown as [Keyframe[]];
    expect(keyframes).toEqual(cueKeyframes(false));
    toneAnimationManager.clearStep(step);
  });

  it("stopAll cancels a running cue", () => {
    const fret = withCue();
    toneAnimationManager.applyToneClass(fret, 0, { fret: { stringIndex: 5, fret: 0 } });
    toneAnimationManager.cueAt(5, 0, 200);
    const animation = animateMock.mock.results[0].value as { cancel: ReturnType<typeof vi.fn> };
    toneAnimationManager.stopAll();
    expect(animation.cancel).toHaveBeenCalled();
  });
});
