/**
 * Performance-optimized tone-based animation system
 * Groups elements by pitch class or octave-specific notes and manages animations globally
 */

const PITCH_CLASS_NAMES = [
  'tone-c', 'tone-cs', 'tone-d', 'tone-ds', 
  'tone-e', 'tone-f', 'tone-fs', 'tone-g', 
  'tone-gs', 'tone-a', 'tone-as', 'tone-b'
];

type AnimationMode = 'pitch-class' | 'octave-specific';

class ToneAnimationManager {
  private activeTimeouts = new Map<string, number>();
  private mode: AnimationMode = 'octave-specific';

  /**
   * Set animation mode: 'pitch-class' highlights all octaves, 'octave-specific' highlights only matching octave
   */
  setMode(mode: AnimationMode): void {
    this.mode = mode;
  }

  /**
   * Get the CSS class name for a pitch class (0-11)
   */
  getPitchClassName(pitchClass: number): string {
    return PITCH_CLASS_NAMES[((pitchClass % 12) + 12) % 12];
  }

  /**
   * Get octave number from absolute semitone (C4 = 0)
   */
  getOctave(absSemitone: number): number {
    return Math.floor(absSemitone / 12);
  }

  /**
   * Get unique identifier for animation grouping
   */
  private getAnimationKey(absSemitone: number): string {
    if (this.mode === 'pitch-class') {
      const pitchClass = ((absSemitone % 12) + 12) % 12;
      return `pc-${pitchClass}`;
    } else {
      // octave-specific mode
      const pitchClass = ((absSemitone % 12) + 12) % 12;
      const octave = this.getOctave(absSemitone);
      return `pc-${pitchClass}-oct-${octave}`;
    }
  }

  /**
   * Get CSS class identifier for body class
   */
  private getBodyClassName(absSemitone: number): string {
    if (this.mode === 'pitch-class') {
      const pitchClass = ((absSemitone % 12) + 12) % 12;
      const className = this.getPitchClassName(pitchClass);
      return `${className}-active`;
    } else {
      // octave-specific mode
      const pitchClass = ((absSemitone % 12) + 12) % 12;
      const octave = this.getOctave(absSemitone);
      const className = this.getPitchClassName(pitchClass);
      return `${className}-oct${octave}-active`;
    }
  }

  /**
   * Trigger animation for all elements of a specific tone/octave
   * This replaces individual element animations with more efficient grouped animations
   * 
   * @param absSemitone - The absolute semitone to animate
   * @param durationMs - Animation duration in milliseconds  
   * @param forceMode - Override the global mode for this specific call
   */
  flashTone(absSemitone: number, durationMs: number = 1200, forceMode?: AnimationMode): void {
    const effectiveMode = forceMode || this.mode;
    const animationKey = effectiveMode === 'pitch-class' 
      ? `pc-${((absSemitone % 12) + 12) % 12}`
      : `pc-${((absSemitone % 12) + 12) % 12}-oct-${this.getOctave(absSemitone)}`;
    
    // Clear any existing timeout for this animation group
    const existingTimeout = this.activeTimeouts.get(animationKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    if (effectiveMode === 'pitch-class') {
      // Use the original CSS class approach for pitch-class mode
      const pitchClass = ((absSemitone % 12) + 12) % 12;
      const className = this.getPitchClassName(pitchClass);
      const bodyClassName = `${className}-active`;
      
      document.body.classList.add(bodyClassName);
      
      const timeoutId = window.setTimeout(() => {
        document.body.classList.remove(bodyClassName);
        this.activeTimeouts.delete(animationKey);
      }, durationMs);
      
      this.activeTimeouts.set(animationKey, timeoutId);
    } else {
      // For octave-specific mode, use a more targeted approach
      this.flashOctaveSpecific(absSemitone, durationMs, animationKey);
    }
  }

  /**
   * Flash only elements that match both pitch class and octave
   */
  private flashOctaveSpecific(absSemitone: number, durationMs: number, animationKey: string): void {
    const pitchClass = ((absSemitone % 12) + 12) % 12;
    const octave = this.getOctave(absSemitone);
    const pitchClassName = this.getPitchClassName(pitchClass);
    
    // Find all elements that match both tone and octave
    const selector = `.${pitchClassName}-oct${octave} .tone-overlay`;
    const elements = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
    
    // Animate each matching element using Web Animation API (but only the matched subset)
    elements.forEach(el => {
      try {
        el.animate([
          { opacity: 0.9, transform: 'translateZ(0)' }, 
          { opacity: 0, transform: 'translateZ(0)' }
        ], { 
          duration: durationMs, 
          easing: 'ease-out' 
        });
      } catch {}
    });
    
    // Set timeout to clean up
    const timeoutId = window.setTimeout(() => {
      this.activeTimeouts.delete(animationKey);
    }, durationMs);
    
    this.activeTimeouts.set(animationKey, timeoutId);
  }

  /**
   * Stop all active animations
   */
  stopAll(): void {
    // Clear all timeouts
    this.activeTimeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.activeTimeouts.clear();

    // Remove all active classes (both pitch-class and octave-specific)
    const bodyClasses = Array.from(document.body.classList);
    bodyClasses.forEach(cls => {
      if (cls.includes('-active')) {
        document.body.classList.remove(cls);
      }
    });
  }

  /**
   * Apply tone classes to an element based on its absolute semitone
   */
  applyToneClass(element: HTMLElement, absSemitone: number): void {
    const pitchClass = ((absSemitone % 12) + 12) % 12;
    const octave = this.getOctave(absSemitone);
    const pitchClassName = this.getPitchClassName(pitchClass);
    
    // Remove any existing tone classes
    PITCH_CLASS_NAMES.forEach(cls => {
      element.classList.remove(cls);
      // Also remove octave-specific classes
      for (let oct = -5; oct <= 10; oct++) {
        element.classList.remove(`${cls}-oct${oct}`);
      }
    });
    
    // Add the correct tone classes and base tone-group class
    element.classList.add('tone-group', pitchClassName, `${pitchClassName}-oct${octave}`);
  }
}

// Export singleton instance
export const toneAnimationManager = new ToneAnimationManager();

// Export utilities
export { PITCH_CLASS_NAMES };