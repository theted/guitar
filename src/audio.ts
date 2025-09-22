let audioCtx: AudioContext | null = null;

export type SoundType = 
  | 'marimba' | 'sine' | 'organ' | 'piano' | 'square' | 'saw'
  | 'guitar-clean' | 'guitar-distorted' | 'bass' | 'synth-lead' 
  | 'synth-pad' | 'bells' | 'strings' | 'flute' | 'brass';

export const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    try { audioCtx.resume(); } catch {}
  } else { 
    try { audioCtx.resume(); } catch {} 
  }
  return audioCtx;
};

export const getCurrentTime = (): number => getAudioContext().currentTime;

// Utility functions for common Web Audio patterns
const createGainNode = (ctx: AudioContext, startTime: number, duration: number, envelope: EnvelopeConfig): GainNode => {
  const gain = ctx.createGain();
  const { attack, attackLevel, decay, sustain, release } = envelope;
  
  gain.gain.setValueAtTime(0.0001, startTime);
  
  if (attack > 0) {
    const rampFn = envelope.attackCurve === 'exponential' ? 'exponentialRampToValueAtTime' : 'linearRampToValueAtTime';
    gain.gain[rampFn](attackLevel, startTime + attack);
  } else {
    gain.gain.setValueAtTime(attackLevel, startTime);
  }
  
  if (sustain !== attackLevel) {
    gain.gain.exponentialRampToValueAtTime(sustain, startTime + attack + decay);
  }
  
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration - release);
  
  return gain;
};

const createOscillator = (ctx: AudioContext, frequency: number, type: OscillatorType = 'sine'): OscillatorNode => {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = frequency;
  return osc;
};

const createFilter = (ctx: AudioContext, type: BiquadFilterType, frequency: number, Q: number = 1): BiquadFilterNode => {
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = frequency;
  filter.Q.value = Q;
  return filter;
};

const semitoneToFrequency = (semitoneFromE0: number): number => {
  // Distance from A4 (440Hz): semitone - 5 (E to A is 5 semitones)
  const distanceFromA = semitoneFromE0 - 5;
  return 440 * Math.pow(2, distanceFromA / 12);
};

// Envelope configuration
type EnvelopeConfig = {
  attack: number;
  attackLevel: number;
  decay: number;
  sustain: number;
  release: number;
  attackCurve?: 'linear' | 'exponential';
};

// Oscillator layer for complex sounds
type OscillatorLayer = {
  frequency: number;
  type: OscillatorType;
  gain: number;
  envelope?: Partial<EnvelopeConfig>;
  detune?: number;
};

// Effects configuration
type EffectConfig = {
  reverb?: {
    roomSize: number;  // 0-1
    damping: number;   // 0-1
    wet: number;       // 0-1 mix level
  };
  distortion?: {
    drive: number;     // 1-20 gain multiplier
    tone: number;      // 0-1 brightness
    wet: number;       // 0-1 mix level
  };
  delay?: {
    time: number;      // seconds
    feedback: number;  // 0-1
    wet: number;       // 0-1 mix level
  };
};

// Sound configuration
type SoundConfig = {
  layers: OscillatorLayer[];
  masterEnvelope: EnvelopeConfig;
  filter?: {
    type: BiquadFilterType;
    frequency: number;
    Q?: number;
  };
  effects?: EffectConfig;
};

// Predefined sound configurations
const SOUND_PRESETS: Record<SoundType, SoundConfig> = {
  sine: {
    layers: [
      { frequency: 1, type: 'sine', gain: 0.9 }
    ],
    masterEnvelope: {
      attack: 0.008,
      attackLevel: 0.8,
      decay: 0.1,
      sustain: 0.6,
      release: 0.3
    }
  },

  square: {
    layers: [
      { frequency: 1, type: 'square', gain: 0.7 }
    ],
    masterEnvelope: {
      attack: 0.005,
      attackLevel: 0.7,
      decay: 0.05,
      sustain: 0.5,
      release: 0.2,
      attackCurve: 'linear'
    }
  },

  saw: {
    layers: [
      { frequency: 1, type: 'sawtooth', gain: 0.7 }
    ],
    masterEnvelope: {
      attack: 0.005,
      attackLevel: 0.7,
      decay: 0.05,
      sustain: 0.5,
      release: 0.2,
      attackCurve: 'linear'
    }
  },

  marimba: {
    layers: [
      { frequency: 1, type: 'sine', gain: 0.9 },
      { frequency: 2.67, type: 'triangle', gain: 0.4, envelope: { decay: 0.4, sustain: 0.1 } }
    ],
    masterEnvelope: {
      attack: 0.004,
      attackLevel: 0.8,
      decay: 0.1,
      sustain: 0.3,
      release: 0.5
    },
    filter: {
      type: 'bandpass',
      frequency: 2,
      Q: 6
    }
  },

  organ: {
    layers: [
      { frequency: 1, type: 'sine', gain: 0.8 },
      { frequency: 2, type: 'sine', gain: 0.4 },
      { frequency: 3, type: 'sine', gain: 0.25 },
      { frequency: 5, type: 'sine', gain: 0.18 }
    ],
    masterEnvelope: {
      attack: 0.025,
      attackLevel: 0.9,
      decay: 0.1,
      sustain: 0.8,
      release: 0.4,
      attackCurve: 'linear'
    }
  },

  piano: {
    layers: [
      { frequency: 1, type: 'triangle', gain: 0.9 },
      { frequency: 1.005, type: 'sine', gain: 0.4, envelope: { decay: 0.5, sustain: 0.2 } }
    ],
    masterEnvelope: {
      attack: 0.005,
      attackLevel: 0.9,
      decay: 0.2,
      sustain: 0.4,
      release: 0.6,
      attackCurve: 'linear'
    },
    filter: {
      type: 'lowpass',
      frequency: 6,
      Q: 0.8
    }
  },

  'guitar-clean': {
    layers: [
      { frequency: 1, type: 'sawtooth', gain: 0.7 },
      { frequency: 1.01, type: 'triangle', gain: 0.5, detune: 8 },
      { frequency: 2, type: 'sine', gain: 0.2, envelope: { decay: 0.3, sustain: 0.1 } },
      { frequency: 3.2, type: 'sine', gain: 0.15, envelope: { decay: 0.2, sustain: 0.05 } }
    ],
    masterEnvelope: {
      attack: 0.008,
      attackLevel: 0.8,
      decay: 0.15,
      sustain: 0.6,
      release: 1.2
    },
    filter: {
      type: 'bandpass',
      frequency: 3.5,
      Q: 1.2
    },
    effects: {
      reverb: {
        roomSize: 0.3,
        damping: 0.4,
        wet: 0.15
      }
    }
  },

  'guitar-distorted': {
    layers: [
      { frequency: 1, type: 'sawtooth', gain: 0.8 },
      { frequency: 1.01, type: 'square', gain: 0.6, detune: -12 },
      { frequency: 2, type: 'sawtooth', gain: 0.3, envelope: { decay: 0.4, sustain: 0.2 } }
    ],
    masterEnvelope: {
      attack: 0.005,
      attackLevel: 0.9,
      decay: 0.1,
      sustain: 0.7,
      release: 0.8,
      attackCurve: 'linear'
    },
    filter: {
      type: 'bandpass',
      frequency: 4,
      Q: 0.8
    },
    effects: {
      distortion: {
        drive: 8,
        tone: 0.7,
        wet: 0.6
      },
      delay: {
        time: 0.12,
        feedback: 0.25,
        wet: 0.2
      }
    }
  },

  bass: {
    layers: [
      { frequency: 1, type: 'sawtooth', gain: 0.9 },
      { frequency: 0.5, type: 'square', gain: 0.6, envelope: { decay: 0.3, sustain: 0.4 } },
      { frequency: 2, type: 'triangle', gain: 0.2, envelope: { decay: 0.15, sustain: 0.1 } }
    ],
    masterEnvelope: {
      attack: 0.01,
      attackLevel: 0.9,
      decay: 0.1,
      sustain: 0.7,
      release: 0.4
    },
    filter: {
      type: 'lowpass',
      frequency: 1.5,
      Q: 0.7
    }
  },

  'synth-lead': {
    layers: [
      { frequency: 1, type: 'sawtooth', gain: 0.8 },
      { frequency: 1.005, type: 'sawtooth', gain: 0.8, detune: 5 },
      { frequency: 2, type: 'square', gain: 0.4, envelope: { decay: 0.2, sustain: 0.3 } }
    ],
    masterEnvelope: {
      attack: 0.02,
      attackLevel: 0.9,
      decay: 0.1,
      sustain: 0.8,
      release: 0.3
    },
    filter: {
      type: 'lowpass',
      frequency: 4,
      Q: 2
    },
    effects: {
      delay: {
        time: 0.08,
        feedback: 0.3,
        wet: 0.25
      }
    }
  },

  'synth-pad': {
    layers: [
      { frequency: 1, type: 'sawtooth', gain: 0.6 },
      { frequency: 1.01, type: 'sawtooth', gain: 0.6, detune: -8 },
      { frequency: 0.5, type: 'triangle', gain: 0.5 },
      { frequency: 2, type: 'sine', gain: 0.3, envelope: { decay: 0.4, sustain: 0.6 } }
    ],
    masterEnvelope: {
      attack: 0.3,
      attackLevel: 0.7,
      decay: 0.2,
      sustain: 0.6,
      release: 1.5
    },
    filter: {
      type: 'lowpass',
      frequency: 2.5,
      Q: 0.5
    },
    effects: {
      reverb: {
        roomSize: 0.8,
        damping: 0.3,
        wet: 0.4
      }
    }
  },

  bells: {
    layers: [
      { frequency: 1, type: 'sine', gain: 0.8 },
      { frequency: 2.76, type: 'sine', gain: 0.6, envelope: { decay: 0.3, sustain: 0.2 } },
      { frequency: 5.4, type: 'sine', gain: 0.4, envelope: { decay: 0.2, sustain: 0.1 } },
      { frequency: 8.93, type: 'sine', gain: 0.25, envelope: { decay: 0.15, sustain: 0.05 } }
    ],
    masterEnvelope: {
      attack: 0.002,
      attackLevel: 0.9,
      decay: 0.4,
      sustain: 0.3,
      release: 2.0
    },
    filter: {
      type: 'bandpass',
      frequency: 3,
      Q: 2
    },
    effects: {
      reverb: {
        roomSize: 0.6,
        damping: 0.2,
        wet: 0.3
      }
    }
  },

  strings: {
    layers: [
      { frequency: 1, type: 'sawtooth', gain: 0.7 },
      { frequency: 1.01, type: 'sawtooth', gain: 0.7, detune: 4 },
      { frequency: 2, type: 'triangle', gain: 0.4, envelope: { decay: 0.3, sustain: 0.5 } },
      { frequency: 3, type: 'sine', gain: 0.2, envelope: { decay: 0.2, sustain: 0.3 } }
    ],
    masterEnvelope: {
      attack: 0.1,
      attackLevel: 0.8,
      decay: 0.2,
      sustain: 0.7,
      release: 1.0
    },
    filter: {
      type: 'lowpass',
      frequency: 3,
      Q: 0.8
    },
    effects: {
      reverb: {
        roomSize: 0.5,
        damping: 0.4,
        wet: 0.25
      }
    }
  },

  flute: {
    layers: [
      { frequency: 1, type: 'sine', gain: 0.9 },
      { frequency: 2, type: 'triangle', gain: 0.3, envelope: { decay: 0.2, sustain: 0.4 } },
      { frequency: 3, type: 'sine', gain: 0.15, envelope: { decay: 0.15, sustain: 0.2 } }
    ],
    masterEnvelope: {
      attack: 0.05,
      attackLevel: 0.8,
      decay: 0.1,
      sustain: 0.7,
      release: 0.5
    },
    filter: {
      type: 'lowpass',
      frequency: 4,
      Q: 1.5
    },
    effects: {
      reverb: {
        roomSize: 0.4,
        damping: 0.5,
        wet: 0.2
      }
    }
  },

  brass: {
    layers: [
      { frequency: 1, type: 'sawtooth', gain: 0.8 },
      { frequency: 2, type: 'square', gain: 0.5, envelope: { decay: 0.2, sustain: 0.6 } },
      { frequency: 3, type: 'triangle', gain: 0.3, envelope: { decay: 0.15, sustain: 0.4 } },
      { frequency: 4, type: 'sine', gain: 0.2, envelope: { decay: 0.1, sustain: 0.2 } }
    ],
    masterEnvelope: {
      attack: 0.03,
      attackLevel: 0.9,
      decay: 0.1,
      sustain: 0.8,
      release: 0.6
    },
    filter: {
      type: 'bandpass',
      frequency: 2.5,
      Q: 1.2
    },
    effects: {
      reverb: {
        roomSize: 0.3,
        damping: 0.6,
        wet: 0.15
      }
    }
  }
};

// Effects creation functions
const createReverb = (ctx: AudioContext, config: { roomSize: number; damping: number; wet: number }): ConvolverNode => {
  const convolver = ctx.createConvolver();
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * config.roomSize * 3; // 0-3 seconds based on room size
  const impulse = ctx.createBuffer(2, length, sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const decay = Math.pow(1 - config.damping, i / sampleRate);
      channelData[i] = (Math.random() * 2 - 1) * decay * Math.pow(1 - i / length, 2);
    }
  }
  
  convolver.buffer = impulse;
  return convolver;
};

const createDistortion = (ctx: AudioContext, config: { drive: number; tone: number; wet: number }): WaveShaperNode => {
  const shaper = ctx.createWaveShaper();
  const samples = 44100;
  const curve = new Float32Array(samples);
  const deg = Math.PI / 180;
  
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + config.drive) * x * 20 * deg) / (Math.PI + config.drive * Math.abs(x));
  }
  
  shaper.curve = curve;
  shaper.oversample = '4x';
  return shaper;
};

const createDelay = (ctx: AudioContext, config: { time: number; feedback: number; wet: number }): { input: GainNode; output: GainNode } => {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const delay = ctx.createDelay(Math.max(0.001, config.time));
  const feedback = ctx.createGain();
  const wet = ctx.createGain();
  
  delay.delayTime.value = Math.max(0.001, config.time);
  feedback.gain.value = Math.min(0.95, config.feedback);
  wet.gain.value = config.wet;
  
  input.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(wet);
  wet.connect(output);
  input.connect(output); // dry signal
  
  return { input, output };
};

// Main sound synthesis function
const synthesizeSound = (
  ctx: AudioContext,
  baseFreq: number,
  startTime: number,
  duration: number,
  config: SoundConfig
): void => {
  // Create master gain node
  const master = createGainNode(ctx, startTime, duration, config.masterEnvelope);
  master.connect(ctx.destination);
  
  // Build effects chain from end to beginning (master <- reverb <- delay <- distortion <- filter <- input)
  let chainInput: AudioNode = master;
  
  // Reverb (last in chain)
  if (config.effects?.reverb) {
    const reverb = createReverb(ctx, config.effects.reverb);
    const wetGain = ctx.createGain();
    const dryGain = ctx.createGain();
    const mixGain = ctx.createGain();
    
    wetGain.gain.value = config.effects.reverb.wet;
    dryGain.gain.value = 1 - config.effects.reverb.wet;
    
    // Connect reverb effect
    mixGain.connect(reverb);
    reverb.connect(wetGain);
    wetGain.connect(master);
    
    // Connect dry path
    mixGain.connect(dryGain);
    dryGain.connect(master);
    
    chainInput = mixGain;
  }
  
  // Delay (before reverb)
  if (config.effects?.delay) {
    const delayEffect = createDelay(ctx, config.effects.delay);
    delayEffect.output.connect(chainInput);
    chainInput = delayEffect.input;
  }
  
  // Distortion (before delay)
  if (config.effects?.distortion) {
    const distortion = createDistortion(ctx, config.effects.distortion);
    const wetGain = ctx.createGain();
    const dryGain = ctx.createGain();
    const mixGain = ctx.createGain();
    
    wetGain.gain.value = config.effects.distortion.wet;
    dryGain.gain.value = 1 - config.effects.distortion.wet;
    
    // Connect distortion effect
    mixGain.connect(distortion);
    distortion.connect(wetGain);
    wetGain.connect(chainInput);
    
    // Connect dry path
    mixGain.connect(dryGain);
    dryGain.connect(chainInput);
    
    chainInput = mixGain;
  }
  
  // Filter (first in chain)
  if (config.filter) {
    const filterFreq = config.filter.frequency > 20 
      ? config.filter.frequency 
      : baseFreq * config.filter.frequency;
    
    const filter = createFilter(ctx, config.filter.type, Math.min(20000, filterFreq), config.filter.Q);
    filter.connect(chainInput);
    chainInput = filter;
  }

  // Create oscillator layers and connect to effects chain input
  config.layers.forEach((layer) => {
    const freq = baseFreq * layer.frequency;
    const osc = createOscillator(ctx, freq, layer.type);
    
    // Create individual gain envelope for this layer
    const layerEnvelope = {
      ...config.masterEnvelope,
      ...layer.envelope,
      attackLevel: (layer.envelope?.attackLevel ?? config.masterEnvelope.attackLevel) * layer.gain
    };
    
    const layerGain = createGainNode(ctx, startTime, duration, layerEnvelope);
    
    // Apply detune if specified
    if (layer.detune) {
      osc.detune.value = layer.detune;
    }
    
    // Connect to the effects chain input
    osc.connect(layerGain);
    layerGain.connect(chainInput);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  });
};

// Public API
export const playSemitoneAt = (
  semitoneFromE0: number,
  startAtTime: number,
  opts?: { duration?: number; type?: SoundType }
): void => {
  const ctx = getAudioContext();
  const duration = opts?.duration ?? 1.2;
  const soundType = opts?.type ?? 'marimba';
  const frequency = semitoneToFrequency(semitoneFromE0);

  const config = SOUND_PRESETS[soundType];
  if (!config) {
    console.warn(`Unknown sound type: ${soundType}, falling back to sine`);
    synthesizeSound(ctx, frequency, startAtTime, duration, SOUND_PRESETS.sine);
    return;
  }

  synthesizeSound(ctx, frequency, startAtTime, duration, config);
};

export const playSemitone = (
  semitoneFromE0: number, 
  opts?: { duration?: number; type?: SoundType }
): void => {
  const ctx = getAudioContext();
  playSemitoneAt(semitoneFromE0, ctx.currentTime, opts);
};