export type AbsSemitone = number & { readonly _brand: 'AbsSemitone' };
export type PitchClass  = number & { readonly _brand: 'PitchClass' };  // 0–11
export type Degree      = number & { readonly _brand: 'Degree' };      // 1-based
export type KeyOffset   = number & { readonly _brand: 'KeyOffset' };   // 0–11

export const absSemitone = (n: number): AbsSemitone => n as AbsSemitone;
export const pitchClass  = (n: number): PitchClass  => n as PitchClass;
export const degree      = (n: number): Degree      => n as Degree;
export const keyOffset   = (n: number): KeyOffset   => n as KeyOffset;
