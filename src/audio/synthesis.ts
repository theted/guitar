import { activeVoices, voicesByNote, getMasterBus, getReverbLevel, MAX_POLYPHONY, type ActiveVoice } from "./context";
import { VOICE_CLEANUP_EXTRA_MS } from "../constants";
import { createDistortion, createDelay, getSharedReverb, reverbRouting } from "./effects";
import type { EnvelopeConfig, SoundConfig } from "./presets";
import { getPluckBuffer } from "./pluck";
import {
  SILENT,
  envelopeLevelAt,
  envelopeTimes,
  layerEnvelope,
  stopPlan,
  sustainLevel,
  type EnvelopeTimes,
} from "./envelope";

/** A gain shaped by an envelope, kept with its timing so the voice can fade it out */
type ShapedGain = { param: AudioParam; envelope: EnvelopeConfig; times: EnvelopeTimes };

const createEnvelopeGain = (
  ctx: AudioContext,
  envelope: EnvelopeConfig,
  times: EnvelopeTimes,
): GainNode => {
  const gain = ctx.createGain();
  const param = gain.gain;
  const sustain = sustainLevel(envelope);

  // Rest silent rather than at the GainNode default of 1, so nothing leaks
  // through if the automation below is cancelled before the note starts
  param.value = SILENT;
  param.setValueAtTime(SILENT, times.start);

  if (times.attackEnd > times.start) {
    if (envelope.attackCurve === "exponential") {
      param.exponentialRampToValueAtTime(envelope.attackLevel, times.attackEnd);
    } else {
      param.linearRampToValueAtTime(envelope.attackLevel, times.attackEnd);
    }
  } else {
    param.setValueAtTime(envelope.attackLevel, times.start);
  }

  if (envelope.sustain !== envelope.attackLevel) {
    param.exponentialRampToValueAtTime(sustain, times.decayEnd);
  }

  // Exponential ramps reject zero targets, so the release ends at SILENT.
  // envelopeTimes never lets it start before the decay is over or end
  // before it has run its length; the voice's sources stop only after it.
  param.setValueAtTime(sustain, times.releaseStart);
  param.exponentialRampToValueAtTime(SILENT, times.end);

  return gain;
};

/** Fade a sounding envelope from `at` down to zero at `silentAt` */
const fadeOut = ({ param, envelope, times }: ShapedGain, at: number, silentAt: number) => {
  if (typeof param.cancelAndHoldAtTime === "function") {
    param.cancelAndHoldAtTime(at);
  } else {
    // Without cancelAndHoldAtTime (Firefox), cancelling drops a ramp that's
    // under way and the level would jump: pin the level it has reached
    param.cancelScheduledValues(at);
    param.setValueAtTime(envelopeLevelAt(envelope, times, at), at);
  }
  param.linearRampToValueAtTime(0, silentAt);
};

const createOscillator = (
  ctx: AudioContext,
  frequency: number,
  type: OscillatorType = "sine",
): OscillatorNode => {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = frequency;
  return osc;
};

const createFilter = (
  ctx: AudioContext,
  type: BiquadFilterType,
  frequency: number,
  Q: number = 1,
): BiquadFilterNode => {
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = frequency;
  filter.Q.value = Q;
  return filter;
};

export const semitoneToFrequency = (semitoneFromE0: number): number => {
  const distanceFromA = semitoneFromE0 - 5;
  return 440 * Math.pow(2, distanceFromA / 12);
};

export const synthesizeSound = (
  ctx: AudioContext,
  semitone: number,
  baseFreq: number,
  startTime: number,
  duration: number,
  config: SoundConfig,
  /** Identifies the preset, for caching rendered strings */
  soundKey = "custom",
): ActiveVoice => {
  // Voice stealing: the previous voice on this pitch fades out as the new one
  // starts (not when it's scheduled, up to a lookahead window earlier).
  // Prevents volume doubling when the same note is retriggered rapidly.
  voicesByNote.get(semitone)?.stop(startTime);

  // A plucked string rings on after its step, the way a guitar note does when
  // the next one is played on another string; slow phrases ring longer
  if (config.pluck) {
    duration = Math.min(config.pluck.length, Math.max(0.4, duration * 3));
  }

  // Polyphony cap: if we're at the limit, evict the oldest active voice.
  // Sets iterate in insertion order so .values().next() gives the oldest entry.
  if (activeVoices.size >= MAX_POLYPHONY) {
    activeVoices.values().next().value?.stop();
  }

  // Everything passes through the master envelope, so the voice is silent
  // once it is: that, not the end of the step, is when the voice ends
  const masterTimes = envelopeTimes(startTime, duration, config.masterEnvelope);
  const endTime = masterTimes.end;
  const master = createEnvelopeGain(ctx, config.masterEnvelope, masterTimes);

  // The enveloped voice goes out dry, and is sent into its room's shared
  // reverb (effects.ts): the room's tail rings on after the voice has ended,
  // and every note sounds in the same space
  const routing = reverbRouting(config);
  const dry = ctx.createGain();
  dry.gain.value = routing.dry;
  master.connect(dry);
  dry.connect(getMasterBus());

  // Only the voice's own nodes are ever disconnected — never the shared reverb
  const nodesToDisconnect: AudioNode[] = [master, dry];
  const sources: AudioScheduledSourceNode[] = [];
  const shapedGains: ShapedGain[] = [
    { param: master.gain, envelope: config.masterEnvelope, times: masterTimes },
  ];

  // With the Room setting off, nothing is sent: no reverb runs at all
  if (routing.send > 0 && getReverbLevel() > 0) {
    const send = ctx.createGain();
    send.gain.value = routing.send;
    master.connect(send);
    send.connect(getSharedReverb(ctx, routing.room));
    nodesToDisconnect.push(send);
  }

  // Build the effects chain from end to beginning (master ← delay ← distortion ← filter)
  let chainInput: AudioNode = master;

  if (config.effects?.delay) {
    const delayEffect = createDelay(ctx, config.effects.delay);
    nodesToDisconnect.push(
      delayEffect.input,
      delayEffect.output,
      delayEffect.delayNode,
      delayEffect.feedbackNode,
      delayEffect.wetNode,
    );
    delayEffect.output.connect(chainInput);
    chainInput = delayEffect.input;
  }

  if (config.effects?.distortion) {
    const distortion = createDistortion(ctx, config.effects.distortion);
    const wetGain = ctx.createGain();
    const dryGain = ctx.createGain();
    const mixGain = ctx.createGain();

    nodesToDisconnect.push(distortion, wetGain, dryGain, mixGain);
    wetGain.gain.value = config.effects.distortion.wet;
    dryGain.gain.value = 1 - config.effects.distortion.wet;

    mixGain.connect(distortion);
    distortion.connect(wetGain);
    wetGain.connect(chainInput);
    mixGain.connect(dryGain);
    dryGain.connect(chainInput);
    chainInput = mixGain;
  }

  if (config.filter) {
    const filterFreq =
      config.filter.frequency > 20 ? config.filter.frequency : baseFreq * config.filter.frequency;
    const filter = createFilter(
      ctx,
      config.filter.type,
      Math.min(20000, filterFreq),
      config.filter.Q,
    );
    nodesToDisconnect.push(filter);
    filter.connect(chainInput);
    chainInput = filter;
  }

  config.layers.forEach((layer) => {
    const freq = baseFreq * layer.frequency;
    const osc = createOscillator(ctx, freq, layer.type);

    const envelope = layerEnvelope(config.masterEnvelope, layer);
    const times = envelopeTimes(startTime, duration, envelope);
    const layerGain = createEnvelopeGain(ctx, envelope, times);
    shapedGains.push({ param: layerGain.gain, envelope, times });
    nodesToDisconnect.push(layerGain);

    if (layer.detune) {
      osc.detune.value = layer.detune;
    }

    osc.connect(layerGain);
    layerGain.connect(chainInput);
    osc.start(startTime);
    // Silent once either its own envelope or the master one is
    osc.stop(Math.min(times.end, endTime));
    sources.push(osc);
  });

  if (config.pluck) {
    const source = ctx.createBufferSource();
    source.buffer = getPluckBuffer(ctx, soundKey, baseFreq, config.pluck);
    source.connect(chainInput);
    source.start(startTime);
    source.stop(endTime);
    sources.push(source);
  }

  const voice: ActiveVoice & { stopped: boolean } = {
    stopped: false,
    startTime,
    stop: (time = ctx.currentTime) => {
      if (voice.stopped) return;
      voice.stopped = true;

      const now = ctx.currentTime;
      const plan = stopPlan({ start: startTime, end: endTime }, time, now);

      if (plan.kind === "never") {
        // It hasn't started: hold every gain silent and stop the sources
        // before they start. Cancelling the envelope alone also cancels its
        // opening SILENT, so a note due within the fade would sound
        // unshaped for a moment — a tick on every live change.
        shapedGains.forEach(({ param }) => {
          try {
            param.cancelScheduledValues(now);
            param.setValueAtTime(SILENT, now);
          } catch {}
        });
        sources.forEach((source) => { try { source.stop(startTime); } catch {} });
      } else if (plan.kind === "fade") {
        // Sounding: a short fade, reaching zero exactly as the sources stop
        shapedGains.forEach((shaped) => { try { fadeOut(shaped, plan.at, plan.silentAt); } catch {} });
        sources.forEach((source) => { try { source.stop(plan.silentAt); } catch {} });
      }

      const silentAt = plan.kind === "fade" ? plan.silentAt : plan.kind === "done" ? endTime : now;
      window.setTimeout(() => {
        sources.forEach((source) => { try { source.disconnect(); } catch {} });
        nodesToDisconnect.forEach((node) => { try { node.disconnect(); } catch {} });
      }, Math.max(0, silentAt - now) * 1000 + 50);

      activeVoices.delete(voice);
      if (voicesByNote.get(semitone) === voice) voicesByNote.delete(semitone);
    },
  };

  activeVoices.add(voice);
  voicesByNote.set(semitone, voice);

  // Unregister once the voice has rung out, so the polyphony count includes
  // release tails that outlast the step
  const cleanupDelayMs = Math.max(0, (endTime - ctx.currentTime) * 1000 + VOICE_CLEANUP_EXTRA_MS);
  window.setTimeout(() => {
    voice.stop(endTime);
  }, cleanupDelayMs);

  return voice;
};
