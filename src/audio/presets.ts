import type { PluckConfig } from "./pluck";

export type SoundType =
  | "acoustic-steel"
  | "acoustic-nylon"
  | "guitar-muted"
  | "bass-picked"
  | "marimba"
  | "sine"
  | "organ"
  | "piano"
  | "square"
  | "saw"
  | "guitar-clean"
  | "guitar-distorted"
  | "bass"
  | "synth-lead"
  | "synth-pad"
  | "bells"
  | "strings"
  | "flute"
  | "brass";

export type EnvelopeConfig = {
  attack: number;
  attackLevel: number;
  decay: number;
  sustain: number;
  release: number;
  attackCurve?: "linear" | "exponential";
};

export type OscillatorLayer = {
  frequency: number;
  type: OscillatorType;
  gain: number;
  envelope?: Partial<EnvelopeConfig>;
  detune?: number;
};

export type EffectConfig = {
  reverb?: { roomSize: number; damping: number; wet: number };
  distortion?: { drive: number; tone: number; wet: number };
  delay?: { time: number; feedback: number; wet: number };
};

export type SoundConfig = {
  /** Oscillator layers; empty for plucked sounds */
  layers: OscillatorLayer[];
  /** A Karplus-Strong string instead of oscillators (see pluck.ts) */
  pluck?: PluckConfig;
  masterEnvelope: EnvelopeConfig;
  filter?: { type: BiquadFilterType; frequency: number; Q?: number };
  effects?: EffectConfig;
};

export const SOUND_PRESETS: Record<SoundType, SoundConfig> = {
  sine: {
    layers: [{ frequency: 1, type: "sine", gain: 0.9 }],
    masterEnvelope: { attack: 0.008, attackLevel: 0.8, decay: 0.1, sustain: 0.6, release: 0.3 },
  },

  square: {
    layers: [{ frequency: 1, type: "square", gain: 0.7 }],
    masterEnvelope: { attack: 0.005, attackLevel: 0.7, decay: 0.05, sustain: 0.5, release: 0.2, attackCurve: "linear" },
  },

  saw: {
    layers: [{ frequency: 1, type: "sawtooth", gain: 0.7 }],
    masterEnvelope: { attack: 0.005, attackLevel: 0.7, decay: 0.05, sustain: 0.5, release: 0.2, attackCurve: "linear" },
  },

  marimba: {
    layers: [
      { frequency: 1, type: "sine", gain: 0.9 },
      { frequency: 2.67, type: "triangle", gain: 0.4, envelope: { decay: 0.4, sustain: 0.1 } },
    ],
    masterEnvelope: { attack: 0.004, attackLevel: 0.8, decay: 0.1, sustain: 0.3, release: 0.5 },
    filter: { type: "bandpass", frequency: 2, Q: 6 },
  },

  organ: {
    layers: [
      { frequency: 1, type: "sine", gain: 0.8 },
      { frequency: 2, type: "sine", gain: 0.4 },
      { frequency: 3, type: "sine", gain: 0.25 },
      { frequency: 5, type: "sine", gain: 0.18 },
    ],
    masterEnvelope: { attack: 0.025, attackLevel: 0.9, decay: 0.1, sustain: 0.8, release: 0.4, attackCurve: "linear" },
  },

  piano: {
    layers: [
      { frequency: 1, type: "triangle", gain: 0.9 },
      { frequency: 1.005, type: "sine", gain: 0.4, envelope: { decay: 0.5, sustain: 0.2 } },
    ],
    masterEnvelope: { attack: 0.005, attackLevel: 0.9, decay: 0.2, sustain: 0.4, release: 0.6, attackCurve: "linear" },
    filter: { type: "lowpass", frequency: 6, Q: 0.8 },
  },

  // ── Plucked strings (Karplus-Strong, see pluck.ts) ─────────────────────────
  // Filter frequencies here are absolute Hz: a guitar's tone is set by its
  // body and pickups, not by the note being played. Envelope levels balance
  // the voices to the same loudness (measured RMS on the master bus).

  "acoustic-steel": {
    layers: [],
    pluck: { brightness: 0.72, sustain: 3.2, pickPosition: 0.16, length: 2.4 },
    masterEnvelope: { attack: 0.001, attackLevel: 0.9, decay: 0.05, sustain: 0.9, release: 0.12 },
    filter: { type: "lowpass", frequency: 7000, Q: 0.5 },
    effects: { reverb: { roomSize: 0.35, damping: 0.45, wet: 0.14 } },
  },

  "acoustic-nylon": {
    layers: [],
    pluck: { brightness: 0.38, sustain: 2.6, pickPosition: 0.24, damping: 0.55, length: 2.2 },
    masterEnvelope: { attack: 0.001, attackLevel: 1.1, decay: 0.05, sustain: 1.1, release: 0.12 },
    filter: { type: "lowpass", frequency: 3800, Q: 0.5 },
    effects: { reverb: { roomSize: 0.3, damping: 0.5, wet: 0.16 } },
  },

  "guitar-clean": {
    layers: [],
    pluck: { brightness: 0.6, sustain: 4, pickPosition: 0.1, damping: 0.45, length: 2.6 },
    masterEnvelope: { attack: 0.001, attackLevel: 0.9, decay: 0.05, sustain: 0.9, release: 0.12 },
    filter: { type: "lowpass", frequency: 4200, Q: 0.9 },
    effects: {
      delay: { time: 0.18, feedback: 0.2, wet: 0.12 },
      reverb: { roomSize: 0.3, damping: 0.4, wet: 0.12 },
    },
  },

  "guitar-distorted": {
    layers: [],
    pluck: { brightness: 0.55, sustain: 5, pickPosition: 0.12, length: 2.6 },
    masterEnvelope: { attack: 0.001, attackLevel: 0.95, decay: 0.05, sustain: 0.95, release: 0.12 },
    filter: { type: "lowpass", frequency: 3200, Q: 0.7 },
    effects: {
      distortion: { drive: 12, tone: 0.55, wet: 0.85 },
      delay: { time: 0.12, feedback: 0.2, wet: 0.12 },
    },
  },

  "guitar-muted": {
    layers: [],
    pluck: { brightness: 0.45, sustain: 0.35, pickPosition: 0.12, damping: 0.65, length: 0.6 },
    masterEnvelope: { attack: 0.001, attackLevel: 2.0, decay: 0.05, sustain: 2.0, release: 0.06 },
    filter: { type: "lowpass", frequency: 2200, Q: 0.8 },
    effects: { distortion: { drive: 10, tone: 0.5, wet: 0.8 } },
  },

  bass: {
    layers: [],
    pluck: { brightness: 0.3, sustain: 3.5, pickPosition: 0.28, damping: 0.55, length: 2.6 },
    masterEnvelope: { attack: 0.001, attackLevel: 0.9, decay: 0.05, sustain: 0.9, release: 0.12 },
    filter: { type: "lowpass", frequency: 1600, Q: 0.7 },
  },

  "bass-picked": {
    layers: [],
    pluck: { brightness: 0.65, sustain: 3, pickPosition: 0.12, length: 2.4 },
    masterEnvelope: { attack: 0.001, attackLevel: 1.2, decay: 0.05, sustain: 1.2, release: 0.12 },
    filter: { type: "lowpass", frequency: 3000, Q: 0.8 },
    effects: { distortion: { drive: 2.5, tone: 0.6, wet: 0.25 } },
  },

  "synth-lead": {
    layers: [
      { frequency: 1, type: "sawtooth", gain: 0.8 },
      { frequency: 1.005, type: "sawtooth", gain: 0.8, detune: 5 },
      { frequency: 2, type: "square", gain: 0.4, envelope: { decay: 0.2, sustain: 0.3 } },
    ],
    masterEnvelope: { attack: 0.02, attackLevel: 0.9, decay: 0.1, sustain: 0.8, release: 0.3 },
    filter: { type: "lowpass", frequency: 4, Q: 2 },
    effects: { delay: { time: 0.08, feedback: 0.3, wet: 0.25 } },
  },

  "synth-pad": {
    layers: [
      { frequency: 1, type: "sawtooth", gain: 0.6 },
      { frequency: 1.01, type: "sawtooth", gain: 0.6, detune: -8 },
      { frequency: 0.5, type: "triangle", gain: 0.5 },
      { frequency: 2, type: "sine", gain: 0.3, envelope: { decay: 0.4, sustain: 0.6 } },
    ],
    masterEnvelope: { attack: 0.3, attackLevel: 0.7, decay: 0.2, sustain: 0.6, release: 1.5 },
    filter: { type: "lowpass", frequency: 2.5, Q: 0.5 },
    effects: { reverb: { roomSize: 0.8, damping: 0.3, wet: 0.4 } },
  },

  bells: {
    layers: [
      { frequency: 1, type: "sine", gain: 0.8 },
      { frequency: 2.76, type: "sine", gain: 0.6, envelope: { decay: 0.3, sustain: 0.2 } },
      { frequency: 5.4, type: "sine", gain: 0.4, envelope: { decay: 0.2, sustain: 0.1 } },
      { frequency: 8.93, type: "sine", gain: 0.25, envelope: { decay: 0.15, sustain: 0.05 } },
    ],
    masterEnvelope: { attack: 0.002, attackLevel: 0.9, decay: 0.4, sustain: 0.3, release: 2.0 },
    filter: { type: "bandpass", frequency: 3, Q: 2 },
    effects: { reverb: { roomSize: 0.6, damping: 0.2, wet: 0.3 } },
  },

  strings: {
    layers: [
      { frequency: 1, type: "sawtooth", gain: 0.7 },
      { frequency: 1.01, type: "sawtooth", gain: 0.7, detune: 4 },
      { frequency: 2, type: "triangle", gain: 0.4, envelope: { decay: 0.3, sustain: 0.5 } },
      { frequency: 3, type: "sine", gain: 0.2, envelope: { decay: 0.2, sustain: 0.3 } },
    ],
    masterEnvelope: { attack: 0.1, attackLevel: 0.8, decay: 0.2, sustain: 0.7, release: 1.0 },
    filter: { type: "lowpass", frequency: 3, Q: 0.8 },
    effects: { reverb: { roomSize: 0.5, damping: 0.4, wet: 0.25 } },
  },

  flute: {
    layers: [
      { frequency: 1, type: "sine", gain: 0.9 },
      { frequency: 2, type: "triangle", gain: 0.3, envelope: { decay: 0.2, sustain: 0.4 } },
      { frequency: 3, type: "sine", gain: 0.15, envelope: { decay: 0.15, sustain: 0.2 } },
    ],
    masterEnvelope: { attack: 0.05, attackLevel: 0.8, decay: 0.1, sustain: 0.7, release: 0.5 },
    filter: { type: "lowpass", frequency: 4, Q: 1.5 },
    effects: { reverb: { roomSize: 0.4, damping: 0.5, wet: 0.2 } },
  },

  brass: {
    layers: [
      { frequency: 1, type: "sawtooth", gain: 0.8 },
      { frequency: 2, type: "square", gain: 0.5, envelope: { decay: 0.2, sustain: 0.6 } },
      { frequency: 3, type: "triangle", gain: 0.3, envelope: { decay: 0.15, sustain: 0.4 } },
      { frequency: 4, type: "sine", gain: 0.2, envelope: { decay: 0.1, sustain: 0.2 } },
    ],
    masterEnvelope: { attack: 0.03, attackLevel: 0.9, decay: 0.1, sustain: 0.8, release: 0.6 },
    filter: { type: "bandpass", frequency: 2.5, Q: 1.2 },
    effects: { reverb: { roomSize: 0.3, damping: 0.6, wet: 0.15 } },
  },
};
