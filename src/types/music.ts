export type AbsSemitone = number & { readonly _brand: 'AbsSemitone' };
export type PitchClass  = number & { readonly _brand: 'PitchClass' };  // 0-11
export type KeyOffset   = number & { readonly _brand: 'KeyOffset' };   // 0-11

export const pitchClass = (n: number): PitchClass => n as PitchClass;
