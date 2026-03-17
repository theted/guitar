/**
 * Performance-optimized tone-based animation system
 * Groups elements by pitch class or octave-specific notes and manages animations globally
 */
import { TONE_ANIMATION_DEFAULT_DURATION_MS } from '../constants';

const PITCH_CLASS_NAMES = [
  'tone-c', 'tone-cs', 'tone-d', 'tone-ds',
  'tone-e', 'tone-f', 'tone-fs', 'tone-g',
  'tone-gs', 'tone-a', 'tone-as', 'tone-b'
];

type AnimationMode = 'pitch-class' | 'octave-specific';

class ToneAnimationManager {
  private activeTimeouts = new Map<string, number>();
  private mode: AnimationMode = 'octave-specific';
  // Pre-built registry: "pc{pc}-oct{octave}" → Set of fret button elements
  private registry = new Map<string, Set<HTMLElement>>();

  setMode(mode: AnimationMode): void {
    this.mode = mode;
  }

  getPitchClassName(pitchClass: number): string {
    return PITCH_CLASS_NAMES[((pitchClass % 12) + 12) % 12];
  }

  getOctave(absSemitone: number): number {
    return Math.floor(absSemitone / 12);
  }

  private registryKey(pitchClass: number, octave: number): string {
    return `pc${pitchClass}-oct${octave}`;
  }

  /**
   * Register a fret element in the tone registry and apply tone CSS classes.
   * Uses dataset.toneAbs guard to skip no-op updates.
   */
  applyToneClass(element: HTMLElement, absSemitone: number): void {
    // Skip if semitone hasn't changed — avoids all work on re-render
    if (element.dataset.toneAbs === String(absSemitone)) return;

    // Remove from old registry slot and remove old CSS classes
    const oldKey = element.dataset.toneKey;
    if (oldKey) {
      this.registry.get(oldKey)?.delete(element);
      const oldPc = element.dataset.tonePc;
      const oldOct = element.dataset.toneOct;
      if (oldPc !== undefined && oldOct !== undefined) {
        const oldCls = PITCH_CLASS_NAMES[parseInt(oldPc, 10)];
        if (oldCls) {
          element.classList.remove(oldCls, `${oldCls}-oct${oldOct}`);
        }
      }
    }

    const pitchClass = ((absSemitone % 12) + 12) % 12;
    const octave = this.getOctave(absSemitone);
    const pitchClassName = PITCH_CLASS_NAMES[pitchClass];
    const key = this.registryKey(pitchClass, octave);

    // Register in new slot
    let slot = this.registry.get(key);
    if (!slot) { slot = new Set(); this.registry.set(key, slot); }
    slot.add(element);

    // Apply CSS classes (tone-group only added once since classList is idempotent)
    element.classList.add('tone-group', pitchClassName, `${pitchClassName}-oct${octave}`);

    // Store metadata for fast future updates and cleanup
    element.dataset.toneAbs = String(absSemitone);
    element.dataset.toneKey = key;
    element.dataset.tonePc = String(pitchClass);
    element.dataset.toneOct = String(octave);
  }

  /**
   * Remove an element from the registry (call on unmount).
   */
  clearToneClass(element: HTMLElement): void {
    const key = element.dataset.toneKey;
    if (key) this.registry.get(key)?.delete(element);
    const oldPc = element.dataset.tonePc;
    const oldOct = element.dataset.toneOct;
    if (oldPc !== undefined && oldOct !== undefined) {
      const oldCls = PITCH_CLASS_NAMES[parseInt(oldPc, 10)];
      if (oldCls) element.classList.remove('tone-group', oldCls, `${oldCls}-oct${oldOct}`);
    }
    delete element.dataset.toneAbs;
    delete element.dataset.toneKey;
    delete element.dataset.tonePc;
    delete element.dataset.toneOct;
  }

  flashTone(absSemitone: number, durationMs: number = TONE_ANIMATION_DEFAULT_DURATION_MS, forceMode?: AnimationMode): void {
    const effectiveMode = forceMode ?? this.mode;
    const pitchClass = ((absSemitone % 12) + 12) % 12;
    const animationKey = effectiveMode === 'pitch-class'
      ? `pc-${pitchClass}`
      : `pc-${pitchClass}-oct-${this.getOctave(absSemitone)}`;

    const existing = this.activeTimeouts.get(animationKey);
    if (existing) clearTimeout(existing);

    if (effectiveMode === 'pitch-class') {
      const bodyClassName = `${PITCH_CLASS_NAMES[pitchClass]}-active`;
      document.body.classList.add(bodyClassName);
      const tid = window.setTimeout(() => {
        document.body.classList.remove(bodyClassName);
        this.activeTimeouts.delete(animationKey);
      }, durationMs);
      this.activeTimeouts.set(animationKey, tid);
    } else {
      this.flashOctaveSpecific(absSemitone, durationMs, animationKey);
    }
  }

  /**
   * Flash elements matching pitch class + octave using the pre-built registry.
   * No DOM queries — O(matched elements) instead of O(all fret buttons).
   */
  private flashOctaveSpecific(absSemitone: number, durationMs: number, animationKey: string): void {
    const pitchClass = ((absSemitone % 12) + 12) % 12;
    const octave = this.getOctave(absSemitone);
    const elements = this.registry.get(this.registryKey(pitchClass, octave));

    if (elements) {
      elements.forEach((el) => {
        const overlay = el.querySelector('.tone-overlay') as HTMLElement | null;
        if (!overlay) return;
        try {
          overlay.animate(
            [{ opacity: 0.9, transform: 'translateZ(0)' }, { opacity: 0, transform: 'translateZ(0)' }],
            { duration: durationMs, easing: 'ease-out' }
          );
        } catch { /* ignore if Web Animation API unavailable */ }
      });
    }

    const tid = window.setTimeout(() => { this.activeTimeouts.delete(animationKey); }, durationMs);
    this.activeTimeouts.set(animationKey, tid);
  }

  stopAll(): void {
    this.activeTimeouts.forEach((tid) => clearTimeout(tid));
    this.activeTimeouts.clear();
    const bodyClasses = Array.from(document.body.classList);
    bodyClasses.forEach((cls) => { if (cls.includes('-active')) document.body.classList.remove(cls); });
  }
}

export const toneAnimationManager = new ToneAnimationManager();
export { PITCH_CLASS_NAMES };
