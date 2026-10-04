import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULTS, ScaleName, TuningName, KeyName, PhraseMode, scales, tunings, KEYS, PHRASE_MODE_GROUPS, TEMPO } from './constants';
import { SoundType } from './audio';
import { SOUND_PRESETS } from './audio/presets';
import { REVERB_LEVELS, type ReverbSetting } from './audio/effects';

/** What the dots on the neck say */
export type LabelMode = 'note' | 'degree' | 'interval';

/** What lights up when a note plays: its fret, that pitch everywhere, or every octave */
export type FlashMode = 'fret' | 'octave' | 'all';

export type FormState = {
  scale: ScaleName;
  strings: number;
  frets: number;
  tuningName: TuningName;
  tone: KeyName;
  lowAtBottom: boolean;
  /** Mark the scale's notes on the fretboard; off leaves a blank neck to test yourself against */
  highlightEnabled: boolean;
  flashMode: FlashMode;
  /** Mirror the neck: nut on the right */
  leftHanded: boolean;
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
  labelMode: LabelMode;
  soundType: SoundType;
  /** How much of the shared room is heard around each note */
  reverb: ReverbSetting;
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
  flashMode: 'fret',
  leftHanded: false,
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
  labelMode: 'note',
  soundType: 'acoustic-steel',
  reverb: 'normal',
  // The top string's octave: 4 puts high E at E4, a real guitar's pitch
  startOctave: 4,
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

// v5 replaced "minimal highlight" (hide the degree badges) with a label mode;
// it is dropped rather than mapped, since the new default already shows no badges.

// v6 replaced the "played octave only" switch with a flash mode. Its old off
// state (every octave) is deliberately not carried over: lighting the one fret
// being played is the new default.

// v7 moved the neck to real guitar pitch. The old default, octave 6, sounded
// two octaves high — harmless on a marimba, a toy-like ukulele with real
// plucked strings — so a stored 6 is taken as that default and moved to 4.

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
  if (stored.startOctave === 6) known.startOctave = 4;
  if (stored.octaveHighlight === true && !('flashMode' in stored)) known.flashMode = 'octave';
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
  return sanitizeFormState(state);
};

const PHRASE_MODES = new Set<string>(PHRASE_MODE_GROUPS.flatMap((group) => group.modes.map((mode) => mode.value)));
const LABEL_MODES = new Set<string>(['note', 'degree', 'interval']);
const FLASH_MODES = new Set<string>(['fret', 'octave', 'all']);
const REVERB_SETTINGS = new Set<string>(Object.keys(REVERB_LEVELS));

const intIn = (value: unknown, min: number, max: number, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;

/**
 * Anything stored that the app can't use falls back to its default. Runs on
 * every load, not only on version upgrades: stored state can be edited by
 * hand, or written by a newer build that was rolled back.
 */
export const sanitizeFormState = (state: FormState): FormState => {
  const clean = { ...state };
  const valid = <K extends keyof FormState>(key: K, ok: boolean) => {
    if (!ok) clean[key] = initial[key];
  };
  valid('scale', typeof clean.scale === 'string' && clean.scale in scales);
  valid('tuningName', typeof clean.tuningName === 'string' && clean.tuningName in tunings);
  valid('tone', (KEYS as readonly string[]).includes(clean.tone));
  valid('phraseMode', PHRASE_MODES.has(clean.phraseMode));
  valid('soundType', typeof clean.soundType === 'string' && clean.soundType in SOUND_PRESETS);
  valid('labelMode', LABEL_MODES.has(clean.labelMode));
  valid('flashMode', FLASH_MODES.has(clean.flashMode));
  valid('reverb', REVERB_SETTINGS.has(clean.reverb));
  clean.strings = intIn(clean.strings, 1, 12, initial.strings);
  clean.frets = intIn(clean.frets, 1, 36, initial.frets);
  clean.startOctave = intIn(clean.startOctave, 0, 9, initial.startOctave);
  clean.bpm = intIn(clean.bpm, TEMPO.MIN, TEMPO.MAX, initial.bpm);
  clean.volume = intIn(clean.volume, 0, 100, initial.volume);
  clean.phraseOctaves = intIn(clean.phraseOctaves, 1, 5, initial.phraseOctaves);
  clean.trailLength = intIn(clean.trailLength, 100, 4000, initial.trailLength);
  valid('positionSpan', [4, 5, 6].includes(clean.positionSpan));
  valid('selectedPosition', clean.selectedPosition === null || (Number.isInteger(clean.selectedPosition) && clean.selectedPosition! >= 1));
  valid('selectedChordDegree', clean.selectedChordDegree === null || (Number.isInteger(clean.selectedChordDegree) && clean.selectedChordDegree! >= 1 && clean.selectedChordDegree! <= 7));
  for (const key of ['lowAtBottom', 'highlightEnabled', 'swing', 'muted', 'phraseDescend', 'phraseLoop', 'reduceAnimations', 'singleStringScale', 'leftHanded'] as const) {
    valid(key, typeof clean[key] === 'boolean');
  }
  return clean;
};

export const useFormStore = create<FormState>()(
  persist(
    (_set, _get) => ({
      ...initial,
    }),
    {
      name: 'formState',
      version: 7,
      migrate: (persisted) => migrateFormState(persisted),
      // Current-version state skips migrate, so validate it on the way in too
      merge: (persisted, current) => sanitizeFormState({ ...current, ...(persisted as Partial<FormState>) }),
    }
  )
);

export const setFormState = (partial: Partial<FormState>) => useFormStore.setState(partial);
