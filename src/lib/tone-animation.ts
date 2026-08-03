/**
 * Tone-flash animation system.
 *
 * Fret/legend elements register themselves once; flashes look the matching
 * elements up in a registry and animate their overlay via the Web Animations
 * API. No DOM queries, no CSS class toggling, no document-wide style
 * invalidation per note.
 *
 * Modes:
 *  - 'pitch-class' (default): a note flashes every registered element with the
 *    same pitch class, in any octave.
 *  - 'octave-specific': only elements at the exact octave flash. Elements
 *    registered with `anyOctave` opt out — they stand for a pitch class rather
 *    than a sounding pitch, so they flash in both modes.
 */
import { TONE_ANIMATION_DEFAULT_DURATION_MS } from '../constants';
import { mod12 } from '../theory/pitch';

type AnimationMode = 'pitch-class' | 'octave-specific';

type RegisterOptions = {
  /** Bind to one fretboard location, so positional flashes can target it */
  fret?: { stringIndex: number; fret: number };
  /**
   * Keep flashing on pitch-class matches even in octave-specific mode. For
   * displays that represent a degree rather than a played pitch — the scale
   * legend has no octave of its own.
   */
  anyOctave?: boolean;
};

const FLASH_KEYFRAMES = [
  { opacity: 0.9, transform: 'translateZ(0)' },
  { opacity: 0, transform: 'translateZ(0)' },
];

class ToneAnimationManager {
  private mode: AnimationMode = 'pitch-class';
  // "pc{pc}-oct{octave}" → elements at that exact pitch
  private byExactPitch = new Map<string, Set<HTMLElement>>();
  // pitch class (0-11) → elements in any octave
  private byPitchClass = new Map<number, Set<HTMLElement>>();
  // pitch class (0-11) → elements that ignore the octave-specific mode
  private byPitchClassAlways = new Map<number, Set<HTMLElement>>();
  // "s{stringIndex}f{fret}" → the single element at that fretboard location
  private byFret = new Map<string, HTMLElement>();
  // phrase step index → the element showing that step
  private byStep = new Map<number, HTMLElement>();
  // scroll container of the phrase steps, so the playing step stays visible
  private stepViewport: HTMLElement | null = null;
  // element → its overlay child, resolved once at registration
  private overlays = new WeakMap<HTMLElement, HTMLElement>();
  // overlay → running animation, so retriggers replace instead of stacking
  private running = new Map<HTMLElement, Animation>();

  setMode(mode: AnimationMode): void {
    this.mode = mode;
  }

  private registryKey(pitchClass: number, octave: number): string {
    return `pc${pitchClass}-oct${octave}`;
  }

  getOctave(absSemitone: number): number {
    return Math.floor(absSemitone / 12);
  }

  private fretKey(stringIndex: number, fret: number): string {
    return `s${stringIndex}f${fret}`;
  }

  /**
   * Register an element as representing a semitone, optionally at a specific
   * fretboard location. Idempotent per semitone; call again with a new value
   * to move it, `clearToneClass` to remove.
   */
  applyToneClass(
    element: HTMLElement,
    absSemitone: number,
    options?: RegisterOptions
  ): void {
    if (element.dataset.toneAbs === String(absSemitone)) {
      if (options?.fret) this.registerFret(element, options.fret);
      return;
    }
    this.detach(element);

    const pitchClass = mod12(absSemitone);
    const octave = this.getOctave(absSemitone);
    const key = this.registryKey(pitchClass, octave);

    let exact = this.byExactPitch.get(key);
    if (!exact) { exact = new Set(); this.byExactPitch.set(key, exact); }
    exact.add(element);

    let byPc = this.byPitchClass.get(pitchClass);
    if (!byPc) { byPc = new Set(); this.byPitchClass.set(pitchClass, byPc); }
    byPc.add(element);

    if (options?.anyOctave) {
      let always = this.byPitchClassAlways.get(pitchClass);
      if (!always) { always = new Set(); this.byPitchClassAlways.set(pitchClass, always); }
      always.add(element);
      element.dataset.toneAnyOctave = '1';
    }

    this.cacheOverlay(element);

    element.dataset.toneAbs = String(absSemitone);
    element.dataset.toneKey = key;
    element.dataset.tonePc = String(pitchClass);
    if (options?.fret) this.registerFret(element, options.fret);
  }

  private cacheOverlay(element: HTMLElement): void {
    const overlay = element.querySelector<HTMLElement>('.tone-overlay');
    if (overlay) this.overlays.set(element, overlay);
  }

  private registerFret(element: HTMLElement, fretId: { stringIndex: number; fret: number }): void {
    const key = this.fretKey(fretId.stringIndex, fretId.fret);
    if (element.dataset.toneFret === key) return;
    if (element.dataset.toneFret) this.byFret.delete(element.dataset.toneFret);
    this.byFret.set(key, element);
    element.dataset.toneFret = key;
  }

  /**
   * Register an element as the display of one phrase step. Steps are identified
   * by position in the sequence, so a phrase can revisit the same pitch without
   * the two occurrences flashing together.
   */
  registerStep(element: HTMLElement, index: number): void {
    this.clearStep(element);
    this.cacheOverlay(element);
    this.byStep.set(index, element);
    element.dataset.toneStep = String(index);
  }

  /** Remove a phrase-step element from the registry (call on unmount). */
  clearStep(element: HTMLElement): void {
    const step = element.dataset.toneStep;
    if (step === undefined) return;
    const index = parseInt(step, 10);
    if (this.byStep.get(index) === element) this.byStep.delete(index);
    delete element.dataset.toneStep;
  }

  /** Remove an element from the registry (call on unmount). */
  clearToneClass(element: HTMLElement): void {
    this.detach(element);
    delete element.dataset.toneAbs;
    delete element.dataset.toneKey;
    delete element.dataset.tonePc;
    delete element.dataset.toneAnyOctave;
  }

  private detach(element: HTMLElement): void {
    const key = element.dataset.toneKey;
    if (key) this.byExactPitch.get(key)?.delete(element);
    const pc = element.dataset.tonePc;
    if (pc !== undefined) {
      this.byPitchClass.get(parseInt(pc, 10))?.delete(element);
      this.byPitchClassAlways.get(parseInt(pc, 10))?.delete(element);
    }
    const fretKey = element.dataset.toneFret;
    if (fretKey && this.byFret.get(fretKey) === element) {
      this.byFret.delete(fretKey);
    }
    delete element.dataset.toneFret;
  }

  /** Flash exactly one fretboard location (guided position practice). */
  flashAt(stringIndex: number, fret: number, durationMs: number = TONE_ANIMATION_DEFAULT_DURATION_MS): void {
    const element = this.byFret.get(this.fretKey(stringIndex, fret));
    if (!element) return;
    this.flashElement(element, durationMs);
  }

  /**
   * The scroll container holding the phrase steps. When set, flashing a step
   * keeps it centred so a long phrase stays readable as it plays.
   */
  setStepViewport(element: HTMLElement | null): void {
    this.stepViewport = element;
  }

  /** Flash the element showing step `index` of the current phrase. */
  flashStep(index: number, durationMs: number = TONE_ANIMATION_DEFAULT_DURATION_MS): void {
    const element = this.byStep.get(index);
    if (!element) return;
    this.flashElement(element, durationMs);
    this.keepStepInView(element);
  }

  // Scrolled directly rather than via scrollIntoView: that would also scroll
  // the page, and smooth scrolling can't keep up at high tempos anyway.
  private keepStepInView(element: HTMLElement): void {
    const viewport = this.stepViewport;
    if (!viewport || !viewport.contains(element)) return;
    const overflow = viewport.scrollWidth - viewport.clientWidth;
    if (overflow <= 0) return;
    const centred = element.offsetLeft - (viewport.clientWidth - element.offsetWidth) / 2;
    viewport.scrollLeft = Math.max(0, Math.min(overflow, centred));
  }

  flashTone(
    absSemitone: number,
    durationMs: number = TONE_ANIMATION_DEFAULT_DURATION_MS,
    forceMode?: AnimationMode
  ): void {
    const mode = forceMode ?? this.mode;
    const pitchClass = mod12(absSemitone);

    if (mode === 'pitch-class') {
      // byPitchClass already contains the anyOctave elements
      this.byPitchClass.get(pitchClass)?.forEach((el) => this.flashElement(el, durationMs));
      return;
    }

    const exact = this.byExactPitch.get(this.registryKey(pitchClass, this.getOctave(absSemitone)));
    exact?.forEach((el) => this.flashElement(el, durationMs));
    this.byPitchClassAlways.get(pitchClass)?.forEach((el) => {
      if (!exact?.has(el)) this.flashElement(el, durationMs);
    });
  }

  private flashElement(element: HTMLElement, durationMs: number): void {
    const overlay = this.overlays.get(element);
    if (!overlay) return;
    this.running.get(overlay)?.cancel();
    try {
      const animation = overlay.animate(FLASH_KEYFRAMES, {
        duration: durationMs,
        easing: 'ease-out',
      });
      this.running.set(overlay, animation);
      animation.onfinish = () => {
        if (this.running.get(overlay) === animation) this.running.delete(overlay);
      };
    } catch { /* Web Animations API unavailable */ }
  }

  stopAll(): void {
    this.running.forEach((animation) => { try { animation.cancel(); } catch { /* noop */ } });
    this.running.clear();
  }
}

export const toneAnimationManager = new ToneAnimationManager();
