import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULTS, ScaleName, TuningName, KeyName, PhraseMode, scales, KEYS } from './constants';
import { SoundType } from './audio';

export type FormState = {
  scale: ScaleName;
  strings: number;
  frets: number;
  tuningName: TuningName;
  tone: KeyName;
  lowAtBottom: boolean;
  highlightEnabled: boolean;
  legendOnly: boolean;
  octaveHighlight: boolean;
  phraseMode: PhraseMode;
  bpm: number;
  swing: boolean;
  phraseOctaves: number;
  phraseDescend: boolean;
  phraseLoop: boolean;
  reduceAnimations: boolean;
  trailLength: number;
  minimalHighlight: boolean;
  scheduleHorizon: number;
  soundType: SoundType;
  startOctave: number;
  oncePerTone: boolean;
};

const initial: FormState = {
  scale: DEFAULTS.SCALE,
  strings: DEFAULTS.STRINGS,
  frets: DEFAULTS.FRETS,
  tuningName: DEFAULTS.TUNING,
  tone: DEFAULTS.KEY,
  lowAtBottom: true,
  highlightEnabled: true,
  legendOnly: false,
  octaveHighlight: false,
  phraseMode: 'full-scale',
  bpm: 300,
  swing: false,
  phraseOctaves: 2,
  phraseDescend: true,
  phraseLoop: false,
  reduceAnimations: false,
  trailLength: 1200,
  minimalHighlight: false,
  scheduleHorizon: 800,
  soundType: 'marimba',
  startOctave: 6,
  oncePerTone: false,
};

// v1 keys were spelled with sharps only; flat keys now use their conventional names
const LEGACY_KEY_NAMES: Record<string, KeyName> = {
  'a#': 'bb',
  'c#': 'db',
  'd#': 'eb',
  'g#': 'ab',
};

// Migrates persisted state from older app versions; runs when the stored
// version is below the current one.
export const migrateFormState = (persisted: unknown): FormState => {
  const state = { ...initial, ...(persisted as Partial<FormState>) };
  if (!(state.scale in scales)) {
    state.scale = DEFAULTS.SCALE;
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
      version: 2,
      migrate: (persisted) => migrateFormState(persisted),
    }
  )
);

export const setFormState = (partial: Partial<FormState>) => useFormStore.setState(partial);
