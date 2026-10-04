import { getReverbBus } from "./context";
import type { EffectConfig } from "./presets";

// ─── Reverb: one shared room per configuration ──────────────────────────────
//
// Voices don't own a reverb. Each room is a single ConvolverNode, created the
// first time a sound needs it and kept for the AudioContext's lifetime,
// feeding the reverb return bus (→ master bus). A voice sends its enveloped
// output into its room: notes share one space, a tail rings out after its
// voice has gone, and there are as many convolvers as rooms in use, not as
// notes sounding.

/** A reverb's space: its length (3 × roomSize seconds) and how fast it decays */
export type ReverbRoom = { roomSize: number; damping: number };

/** Where a voice's sound goes: how much into which room, and how much straight out */
export type ReverbRouting = { room: ReverbRoom; send: number; dry: number };

/**
 * The room for sounds that don't define one: small and soft. It's the nylon
 * guitar's room too, so those share a convolver.
 */
export const DEFAULT_ROOM: ReverbRoom = { roomSize: 0.3, damping: 0.5 };

/**
 * How much a sound without a room of its own sends to the default one. A
 * normalised convolver this size returns about −12 dB of steady-state level,
 * so 0.1 sits the room ~32 dB under the dry sound: a touch below the subtlest
 * designed reverb (the clean guitar's, ~30 dB under) — enough to put every
 * sound in the same space without making the dry ones wet.
 */
export const DEFAULT_ROOM_SEND = 0.1;

/**
 * What a sound sends, to which room. A sound with its own reverb keeps the
 * balance it was designed with (dry 1 − wet, send wet); every other sound
 * stays at full level and sends a little to the default room.
 */
export const reverbRouting = (config: { effects?: EffectConfig }): ReverbRouting => {
  const reverb = config.effects?.reverb;
  if (!reverb) return { room: DEFAULT_ROOM, send: DEFAULT_ROOM_SEND, dry: 1 };
  return {
    room: { roomSize: reverb.roomSize, damping: reverb.damping },
    send: reverb.wet,
    dry: 1 - reverb.wet,
  };
};

/** The Room setting: how much of the shared reverb you hear */
export type ReverbSetting = "off" | "low" | "normal" | "high";

/** Return-bus level per Room setting; "normal" is the balance the sounds were designed with */
export const REVERB_LEVELS: Record<ReverbSetting, number> = {
  off: 0,
  low: 0.5,
  normal: 1,
  high: 1.8,
};

const roomKey = (sampleRate: number, room: ReverbRoom) => `${sampleRate}-${room.roomSize}-${room.damping}`;

/**
 * Cached impulse response buffers keyed by "sampleRate-roomSize-damping".
 * Generating a reverb IR involves O(sampleRate × roomSize × 3 × 2) float ops —
 * 211,680 for synth-pad's room.
 */
const reverbBufferCache = new Map<string, AudioBuffer>();

const getImpulse = (ctx: BaseAudioContext, room: ReverbRoom): AudioBuffer => {
  const sampleRate = ctx.sampleRate;
  const cacheKey = roomKey(sampleRate, room);

  let impulse = reverbBufferCache.get(cacheKey);
  if (!impulse) {
    const length = Math.floor(sampleRate * room.roomSize * 3);
    impulse = ctx.createBuffer(2, length, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - room.damping, i / sampleRate);
        data[i] = (Math.random() * 2 - 1) * decay * Math.pow(1 - i / length, 2);
      }
    }
    reverbBufferCache.set(cacheKey, impulse);
  }
  return impulse;
};

/** The rooms built so far, per context */
const sharedReverbs = new WeakMap<BaseAudioContext, Map<string, ConvolverNode>>();

/**
 * The shared reverb for `room`: created on first use, connected to the
 * reverb return bus, and never disconnected. A voice connects a send gain to
 * it and disconnects only that send when it ends, so its tail rings on.
 */
export const getSharedReverb = (ctx: AudioContext, room: ReverbRoom): ConvolverNode => {
  let rooms = sharedReverbs.get(ctx);
  if (!rooms) {
    rooms = new Map();
    sharedReverbs.set(ctx, rooms);
  }
  const key = roomKey(ctx.sampleRate, room);
  let reverb = rooms.get(key);
  if (!reverb) {
    reverb = ctx.createConvolver();
    reverb.buffer = getImpulse(ctx, room);
    reverb.connect(getReverbBus());
    rooms.set(key, reverb);
  }
  return reverb;
};

/**
 * Cached waveshaper curves keyed by "drive-tone".
 * Generating the 44,100-sample distortion curve is O(44100) per note without caching.
 */
const distortionCurveCache = new Map<string, Float32Array<ArrayBuffer>>();

export const createDistortion = (
  ctx: AudioContext,
  config: { drive: number; tone: number; wet: number },
): WaveShaperNode => {
  const cacheKey = `${config.drive}-${config.tone}`;

  let curve = distortionCurveCache.get(cacheKey);
  if (!curve) {
    const samples = 44100;
    curve = new Float32Array(samples) as Float32Array<ArrayBuffer>;
    const deg = Math.PI / 180;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + config.drive) * x * 20 * deg) / (Math.PI + config.drive * Math.abs(x));
    }
    distortionCurveCache.set(cacheKey, curve);
  }

  const shaper = ctx.createWaveShaper();
  shaper.curve = curve;
  shaper.oversample = '4x';
  return shaper;
};

export const createDelay = (
  ctx: AudioContext,
  config: { time: number; feedback: number; wet: number },
): { input: GainNode; output: GainNode; delayNode: DelayNode; feedbackNode: GainNode; wetNode: GainNode } => {
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
  input.connect(output);

  return { input, output, delayNode: delay, feedbackNode: feedback, wetNode: wet };
};
