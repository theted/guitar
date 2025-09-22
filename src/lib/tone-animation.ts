/**
 * Performance-optimized tone-based animation system
 * Groups elements by pitch class and manages animations globally
 */

const PITCH_CLASS_NAMES = [
  'tone-c', 'tone-cs', 'tone-d', 'tone-ds', 
  'tone-e', 'tone-f', 'tone-fs', 'tone-g', 
  'tone-gs', 'tone-a', 'tone-as', 'tone-b'
];

class ToneAnimationManager {
  private activeTimeouts = new Map<number, number>();

  /**
   * Get the CSS class name for a pitch class (0-11)
   */
  getPitchClassName(pitchClass: number): string {
    return PITCH_CLASS_NAMES[((pitchClass % 12) + 12) % 12];
  }

  /**
   * Trigger animation for all elements of a specific tone
   * This replaces individual element animations with a single class toggle
   */
  flashTone(absSemitone: number, durationMs: number = 1200): void {
    const pitchClass = ((absSemitone % 12) + 12) % 12;
    const className = this.getPitchClassName(pitchClass);
    
    // Clear any existing timeout for this pitch class
    const existingTimeout = this.activeTimeouts.get(pitchClass);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Add active class to trigger animation
    document.body.classList.add(`${className}-active`);
    
    // Remove active class after animation duration
    const timeoutId = window.setTimeout(() => {
      document.body.classList.remove(`${className}-active`);
      this.activeTimeouts.delete(pitchClass);
    }, durationMs);
    
    this.activeTimeouts.set(pitchClass, timeoutId);
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

    // Remove all active classes
    PITCH_CLASS_NAMES.forEach(className => {
      document.body.classList.remove(`${className}-active`);
    });
  }

  /**
   * Apply tone classes to an element based on its absolute semitone
   */
  applyToneClass(element: HTMLElement, absSemitone: number): void {
    const pitchClass = ((absSemitone % 12) + 12) % 12;
    const className = this.getPitchClassName(pitchClass);
    
    // Remove any existing tone classes
    PITCH_CLASS_NAMES.forEach(cls => {
      element.classList.remove(cls);
    });
    
    // Add the correct tone class and base tone-group class
    element.classList.add('tone-group', className);
  }
}

// Export singleton instance
export const toneAnimationManager = new ToneAnimationManager();

// Export utilities
export { PITCH_CLASS_NAMES };