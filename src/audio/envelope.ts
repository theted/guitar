// Envelope timing, kept free of Web Audio so it can be tested: when each
// stage of a note happens, what level it's at, and how a voice is stopped.
import { VOICE_STOP_RAMP_SEC, VOICE_MIN_STOP_SEC } from "../constants";
import type { EnvelopeConfig, OscillatorLayer } from "./presets";

/**
 * The level an envelope treats as silence (−80 dB). Exponential ramps can't
 * reach zero, so they ramp to this, and every envelope gain rests here.
 */
export const SILENT = 0.0001;

/** The shortest release, so no note ends in a click */
const MIN_RELEASE_SEC = 0.005;

/** AudioContext times of each stage of one note's envelope */
export type EnvelopeTimes = {
  start: number;
  attackEnd: number;
  decayEnd: number;
  releaseStart: number;
  /** The envelope has reached silence: nothing it shapes is audible after this */
  end: number;
};

/**
 * When each stage of the envelope happens for a note `duration` seconds long.
 * The release fades over the tail of the note, but it never starts before
 * the decay is over and always runs its full length: a short note on a sound
 * with a long release (bells, pads) rings on past its step instead of being
 * cut off mid-envelope. A note lasts max(duration, attack + decay + release).
 */
export const envelopeTimes = (
  start: number,
  duration: number,
  envelope: EnvelopeConfig,
): EnvelopeTimes => {
  const attackEnd = start + Math.max(0, envelope.attack);
  const decayEnd = attackEnd + Math.max(0, envelope.decay);
  const release = Math.max(MIN_RELEASE_SEC, envelope.release);
  const releaseStart = Math.max(decayEnd, start + duration - release);
  return { start, attackEnd, decayEnd, releaseStart, end: releaseStart + release };
};

/** The level the envelope holds between its decay and its release */
export const sustainLevel = (envelope: EnvelopeConfig): number => Math.max(SILENT, envelope.sustain);

const exponential = (from: number, to: number, progress: number) =>
  from * Math.pow(to / from, progress);

/**
 * The envelope's level at time `t`, as the automation synthesis.ts schedules
 * produces it. Used to pin the level when a voice is faded out on a browser
 * without `cancelAndHoldAtTime`.
 */
export const envelopeLevelAt = (
  envelope: EnvelopeConfig,
  times: EnvelopeTimes,
  t: number,
): number => {
  const peak = envelope.attackLevel;
  const sustain = sustainLevel(envelope);
  const progress = (from: number, to: number) => (t - from) / (to - from);

  if (t < times.start) return SILENT;
  if (t < times.attackEnd) {
    const p = progress(times.start, times.attackEnd);
    return envelope.attackCurve === "exponential"
      ? exponential(SILENT, peak, p)
      : SILENT + (peak - SILENT) * p;
  }
  if (t < times.decayEnd && envelope.sustain !== peak) {
    return exponential(peak, sustain, progress(times.attackEnd, times.decayEnd));
  }
  if (t < times.releaseStart) return sustain;
  if (t < times.end) return exponential(sustain, SILENT, progress(times.releaseStart, times.end));
  return SILENT;
};

/**
 * A layer's envelope: the master envelope with the layer's own overrides, and
 * every level scaled by the layer's gain, so a quiet partial stays quiet
 * through its sustain and not just at the attack peak.
 */
export const layerEnvelope = (master: EnvelopeConfig, layer: OscillatorLayer): EnvelopeConfig => {
  const envelope = { ...master, ...layer.envelope };
  return {
    ...envelope,
    attackLevel: envelope.attackLevel * layer.gain,
    sustain: envelope.sustain * layer.gain,
  };
};

export type StopPlan =
  /** It hasn't started by then, so it never sounds */
  | { kind: "never" }
  /** It's sounding: a short fade from `at`, down to zero by `silentAt` */
  | { kind: "fade"; at: number; silentAt: number }
  /** It has rung out by then: nothing left to do */
  | { kind: "done" };

/**
 * How to stop a voice that sounds from `start` until `end`, asked at `now`
 * to stop at `time` (or now, if that has passed).
 */
export const stopPlan = (
  voice: { start: number; end: number },
  time: number,
  now: number,
): StopPlan => {
  const at = Math.max(time, now);
  if (at <= voice.start) return { kind: "never" };
  if (at >= voice.end) return { kind: "done" };
  return { kind: "fade", at, silentAt: Math.max(at + VOICE_STOP_RAMP_SEC, now + VOICE_MIN_STOP_SEC) };
};
