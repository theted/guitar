export type SoundType =
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
  layers: OscillatorLayer[];
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

  "guitar-clean": {
    layers: [
      { frequency: 1, type: "sawtooth", gain: 0.7 },
      { frequency: 1.01, type: "triangle", gain: 0.5, detune: 8 },
      { frequency: 2, type: "sine", gain: 0.2, envelope: { decay: 0.3, sustain: 0.1 } },
      { frequency: 3.2, type: "sine", gain: 0.15, envelope: { decay: 0.2, sustain: 0.05 } },
    ],
    masterEnvelope: { attack: 0.008, attackLevel: 0.8, decay: 0.15, sustain: 0.6, release: 1.2 },
    filter: { type: "bandpass", frequency: 3.5, Q: 1.2 },
    effects: { reverb: { roomSize: 0.3, damping: 0.4, wet: 0.15 } },
  },

  "guitar-distorted": {
    layers: [
      { frequency: 1, type: "sawtooth", gain: 0.8 },
      { frequency: 1.01, type: "square", gain: 0.6, detune: -12 },
      { frequency: 2, type: "sawtooth", gain: 0.3, envelope: { decay: 0.4, sustain: 0.2 } },
    ],
    masterEnvelope: { attack: 0.005, attackLevel: 0.9, decay: 0.1, sustain: 0.7, release: 0.8, attackCurve: "linear" },
    filter: { type: "bandpass", frequency: 4, Q: 0.8 },
    effects: {
      distortion: { drive: 8, tone: 0.7, wet: 0.6 },
      delay: { time: 0.12, feedback: 0.25, wet: 0.2 },
    },
  },

  bass: {
    layers: [
      { frequency: 1, type: "sawtooth", gain: 0.9 },
      { frequency: 0.5, type: "square", gain: 0.6, envelope: { decay: 0.3, sustain: 0.4 } },
      { frequency: 2, type: "triangle", gain: 0.2, envelope: { decay: 0.15, sustain: 0.1 } },
    ],
    masterEnvelope: { attack: 0.01, attackLevel: 0.9, decay: 0.1, sustain: 0.7, release: 0.4 },
    filter: { type: "lowpass", frequency: 1.5, Q: 0.7 },
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
