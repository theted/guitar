import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULTS, ScaleName, TuningName, Tone, PhraseMode } from './constants';
import { SoundType } from './audio';

export type FormState = {
  scale: ScaleName;
  strings: number;
  frets: number;
  tuningName: TuningName;
  tone: Tone;
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

export const useFormStore = create<FormState>()(
  persist(
    (set, get) => ({
      ...initial,
    }),
    { name: 'formState' }
  )
);

export const setFormState = (partial: Partial<FormState>) => useFormStore.setState(partial);
