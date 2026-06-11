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
 *  - 'octave-specific': only elements at the exact octave flash.
 */
import { TONE_ANIMATION_DEFAULT_DURATION_MS } from '../constants';

type AnimationMode = 'pitch-class' | 'octave-specific';

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

  /**
   * Register an element as representing a semitone. Idempotent per semitone;
   * call again with a new value to move it, `clearToneClass` to remove.
   */
  applyToneClass(element: HTMLElement, absSemitone: number): void {
    if (element.dataset.toneAbs === String(absSemitone)) return;
    this.detach(element);

    const pitchClass = ((absSemitone % 12) + 12) % 12;
    const octave = this.getOctave(absSemitone);
    const key = this.registryKey(pitchClass, octave);

    let exact = this.byExactPitch.get(key);
    if (!exact) { exact = new Set(); this.byExactPitch.set(key, exact); }
    exact.add(element);

    let byPc = this.byPitchClass.get(pitchClass);
    if (!byPc) { byPc = new Set(); this.byPitchClass.set(pitchClass, byPc); }
    byPc.add(element);

    const overlay = element.querySelector<HTMLElement>('.tone-overlay');
    if (overlay) this.overlays.set(element, overlay);

    element.dataset.toneAbs = String(absSemitone);
    element.dataset.toneKey = key;
    element.dataset.tonePc = String(pitchClass);
  }

  /** Remove an element from the registry (call on unmount). */
  clearToneClass(element: HTMLElement): void {
    this.detach(element);
    delete element.dataset.toneAbs;
    delete element.dataset.toneKey;
    delete element.dataset.tonePc;
  }

  private detach(element: HTMLElement): void {
    const key = element.dataset.toneKey;
    if (key) this.byExactPitch.get(key)?.delete(element);
    const pc = element.dataset.tonePc;
    if (pc !== undefined) this.byPitchClass.get(parseInt(pc, 10))?.delete(element);
  }

  flashTone(
    absSemitone: number,
    durationMs: number = TONE_ANIMATION_DEFAULT_DURATION_MS,
    forceMode?: AnimationMode
  ): void {
    const mode = forceMode ?? this.mode;
    const pitchClass = ((absSemitone % 12) + 12) % 12;
    const elements = mode === 'pitch-class'
      ? this.byPitchClass.get(pitchClass)
      : this.byExactPitch.get(this.registryKey(pitchClass, this.getOctave(absSemitone)));
    if (!elements) return;

    elements.forEach((el) => {
      const overlay = this.overlays.get(el);
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
    });
  }

  stopAll(): void {
    this.running.forEach((animation) => { try { animation.cancel(); } catch { /* noop */ } });
    this.running.clear();
  }
}

export const toneAnimationManager = new ToneAnimationManager();
