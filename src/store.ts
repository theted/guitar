import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULTS, ScaleName, TuningName, KeyName, PhraseMode, scales, tunings, KEYS } from './constants';
import { SoundType } from './audio';

export type FormState = {
  scale: ScaleName;
  strings: number;
  frets: number;
  tuningName: TuningName;
  tone: KeyName;
  lowAtBottom: boolean;
  /** Mark the scale's notes on the fretboard; off leaves a blank neck to test yourself against */
  highlightEnabled: boolean;
  octaveHighlight: boolean;
  phraseMode: PhraseMode;
  bpm: number;
  swing: boolean;
  /** Master output level, 0–100 */
  volume: number;
  muted: boolean;
  phraseOctaves: number;
  phraseDescend: boolean;
  phraseLoop: boolean;
  reduceAnimations: boolean;
  trailLength: number;
  minimalHighlight: boolean;
  soundType: SoundType;
  startOctave: number;
  /** Show the scale on the lowest string only, so each tone appears once */
  singleStringScale: boolean;
  /** 1-based degree of the highlighted diatonic chord, or null for none */
  selectedChordDegree: number | null;
  /** 1-based scale position being practiced, or null for off */
  selectedPosition: number | null;
  /** Hand-span window width in frets for position boxes */
  positionSpan: number;
};

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const initial: FormState = {
  scale: DEFAULTS.SCALE,
  strings: DEFAULTS.STRINGS,
  frets: DEFAULTS.FRETS,
  tuningName: DEFAULTS.TUNING,
  tone: DEFAULTS.KEY,
  lowAtBottom: true,
  highlightEnabled: true,
  octaveHighlight: true,
  phraseMode: 'full-scale',
  bpm: 300,
  swing: false,
  volume: 80,
  muted: false,
  phraseOctaves: 2,
  phraseDescend: true,
  phraseLoop: false,
  reduceAnimations: prefersReducedMotion,
  trailLength: 1200,
  minimalHighlight: false,
  soundType: 'marimba',
  startOctave: 6,
  singleStringScale: false,
  selectedChordDegree: null,
  selectedPosition: null,
  positionSpan: 5,
};

// v1 keys were spelled with sharps only; flat keys now use their conventional names
const LEGACY_KEY_NAMES: Record<string, KeyName> = {
  'a#': 'bb',
  'c#': 'db',
  'd#': 'eb',
  'g#': 'ab',
};

// v3 removed catalog entries that were exact duplicates of another entry
const LEGACY_SCALE_NAMES: Record<string, ScaleName> = {
  gypsy: 'double harmonic',
  'whole steps': 'whole tone',
};
const LEGACY_TUNING_NAMES: Record<string, TuningName> = {
  DADGBE: 'Drop D',
  DGDGBD: 'Open G',
  Nashville: 'Standard',
  'Baritone B': 'B Standard',
  'Baritone A': 'A Standard',
};

// v4 renamed the "once per tone" flag to say what it actually does
const RENAMED_FIELDS: Record<string, keyof FormState> = {
  oncePerTone: 'singleStringScale',
};

// Migrates persisted state from older app versions; runs when the stored
// version is below the current one.
export const migrateFormState = (persisted: unknown): FormState => {
  const stored = (persisted ?? {}) as Record<string, unknown>;

  // Only known fields survive, so settings dropped in a past version don't
  // linger in localStorage forever.
  const known: Record<string, unknown> = {};
  for (const key of Object.keys(initial)) {
    if (key in stored) known[key] = stored[key];
  }
  for (const [oldKey, newKey] of Object.entries(RENAMED_FIELDS)) {
    if (oldKey in stored && !(newKey in stored)) known[newKey] = stored[oldKey];
  }

  const state = { ...initial, ...(known as Partial<FormState>) };
  const scale = state.scale as string;
  if (scale in LEGACY_SCALE_NAMES) {
    state.scale = LEGACY_SCALE_NAMES[scale];
  } else if (!(scale in scales)) {
    state.scale = DEFAULTS.SCALE;
  }
  const tuningName = state.tuningName as string;
  if (tuningName in LEGACY_TUNING_NAMES) {
    state.tuningName = LEGACY_TUNING_NAMES[tuningName];
  } else if (!(tuningName in tunings)) {
    state.tuningName = DEFAULTS.TUNING;
  }
  const tone = state.tone as string;
  if (tone in LEGACY_KEY_NAMES) {
    state.tone = LEGACY_KEY_NAMES[tone];
  } else if (!(KEYS as readonly string[]).includes(tone)) {
    state.tone = DEFAULTS.KEY;
  }
  return state;
};

export const useFormStore = create<FormState>()(
  persist(
    (_set, _get) => ({
      ...initial,
    }),
    {
      name: 'formState',
      version: 4,
      migrate: (persisted) => migrateFormState(persisted),
    }
  )
);

export const setFormState = (partial: Partial<FormState>) => useFormStore.setState(partial);
