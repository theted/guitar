import { activeVoices, voicesByNote, MAX_POLYPHONY, type ActiveVoice } from "./context";
import { VOICE_STOP_RAMP_SEC, VOICE_CLEANUP_EXTRA_MS, VOICE_MIN_STOP_SEC } from "../constants";
import { createReverb, createDistortion, createDelay } from "./effects";
import type { EnvelopeConfig, SoundConfig } from "./presets";

const createGainNode = (
  ctx: AudioContext,
  startTime: number,
  duration: number,
  envelope: EnvelopeConfig,
): GainNode => {
  const gain = ctx.createGain();
  const { attack, attackLevel, decay, sustain, release } = envelope;

  gain.gain.setValueAtTime(0.0001, startTime);

  if (attack > 0) {
    const rampFn =
      envelope.attackCurve === "exponential"
        ? "exponentialRampToValueAtTime"
        : "linearRampToValueAtTime";
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
): ActiveVoice => {
  // Voice stealing: stop any existing voice on this pitch before creating the new one.
  // Prevents volume doubling when the same note is retriggered rapidly.
  voicesByNote.get(semitone)?.stop();

  // Polyphony cap: if we're at the limit, evict the oldest active voice.
  // Sets iterate in insertion order so .values().next() gives the oldest entry.
  if (activeVoices.size >= MAX_POLYPHONY) {
    activeVoices.values().next().value?.stop();
  }
  const master = createGainNode(ctx, startTime, duration, config.masterEnvelope);
  master.connect(ctx.destination);

  const nodesToDisconnect: AudioNode[] = [master];
  const oscillators: OscillatorNode[] = [];
  const layerGains: GainNode[] = [];

  // Build effects chain from end to beginning (master ← reverb ← delay ← distortion ← filter)
  let chainInput: AudioNode = master;

  if (config.effects?.reverb) {
    const reverb = createReverb(ctx, config.effects.reverb);
    const wetGain = ctx.createGain();
    const dryGain = ctx.createGain();
    const mixGain = ctx.createGain();

    nodesToDisconnect.push(reverb, wetGain, dryGain, mixGain);
    wetGain.gain.value = config.effects.reverb.wet;
    dryGain.gain.value = 1 - config.effects.reverb.wet;

    mixGain.connect(reverb);
    reverb.connect(wetGain);
    wetGain.connect(master);
    mixGain.connect(dryGain);
    dryGain.connect(master);
    chainInput = mixGain;
  }

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

    const layerEnvelope = {
      ...config.masterEnvelope,
      ...layer.envelope,
      attackLevel:
        (layer.envelope?.attackLevel ?? config.masterEnvelope.attackLevel) * layer.gain,
    };

    const layerGain = createGainNode(ctx, startTime, duration, layerEnvelope);
    layerGains.push(layerGain);
    nodesToDisconnect.push(layerGain);

    if (layer.detune) {
      osc.detune.value = layer.detune;
    }

    osc.connect(layerGain);
    layerGain.connect(chainInput);
    osc.start(startTime);
    osc.stop(startTime + duration);
    oscillators.push(osc);
  });

  const voice: ActiveVoice & { stopped: boolean } = {
    stopped: false,
    stop: (time = ctx.currentTime) => {
      if (voice.stopped) return;
      voice.stopped = true;

      const now = ctx.currentTime;
      const stopAt = Math.max(time, now, startTime);

      try {
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(0.0001, now);
        master.gain.exponentialRampToValueAtTime(0.0001, now + VOICE_STOP_RAMP_SEC);
      } catch {}

      layerGains.forEach((gain) => {
        try {
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + VOICE_STOP_RAMP_SEC);
        } catch {}
      });

      oscillators.forEach((osc) => {
        try { osc.stop(Math.max(stopAt, now + VOICE_MIN_STOP_SEC)); } catch {}
        try { osc.disconnect(); } catch {}
      });

      nodesToDisconnect.forEach((node) => {
        try { node.disconnect(); } catch {}
      });

      activeVoices.delete(voice);
      if (voicesByNote.get(semitone) === voice) voicesByNote.delete(semitone);
    },
  };

  activeVoices.add(voice);
  voicesByNote.set(semitone, voice);

  const cleanupDelayMs = Math.max(0, (startTime + duration - ctx.currentTime) * 1000 + VOICE_CLEANUP_EXTRA_MS);
  window.setTimeout(() => {
    voice.stop(startTime + duration);
  }, cleanupDelayMs);

  return voice;
};
