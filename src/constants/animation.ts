/** Default highlight duration (ms) for a played tone */
export const TONE_ANIMATION_DEFAULT_DURATION_MS = 1200;

/**
 * Colours offered for a played note's glow; the first is the default. They
 * need some saturation: the legend and phrase steps tint by blending, and a
 * near-white glow would vanish on the light page.
 */
export const GLOW_COLORS = [
  { value: '#ffc94a', label: 'Gold' },
  { value: '#ff6b6b', label: 'Coral' },
  { value: '#8ee04a', label: 'Lime' },
  { value: '#38bdf8', label: 'Sky' },
  { value: '#a78bfa', label: 'Violet' },
  { value: '#f472b6', label: 'Pink' },
] as const;

export const DEFAULT_GLOW_COLOR: string = GLOW_COLORS[0].value;
