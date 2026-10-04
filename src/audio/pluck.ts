// Plucked strings by Karplus-Strong synthesis: a burst of noise circulating
// through a delay line one period long, losing a little treble and energy on
// every pass, which is what a vibrating string does. Each note is rendered
// once into a buffer and cached, so playing it costs one buffer source.

export type PluckConfig = {
  /** 0–1: brightness of the pluck (a pick is bright, a thumb is dark) */
  brightness: number;
  /** Seconds a note around 110 Hz takes to fade by 60 dB; higher notes fade faster */
  sustain: number;
  /** 0–0.5: where the string is plucked, as a fraction from the bridge.
   *  Near the bridge is thin and twangy, towards the middle round and warm. */
  pickPosition: number;
  /** 0–1: how much treble each pass through the string loses (0.5 = classic) */
  damping?: number;
  /** Longest a note is allowed to ring, in seconds; the buffer length */
  length: number;
};

/** Seconds for a note at `frequency` to fade by 60 dB */
const decayTime = (frequency: number, sustain: number) =>
  Math.max(0.12, sustain * Math.pow(110 / frequency, 0.45));

/**
 * Render one plucked note. Deterministic for a given `random`, so tests can
 * check pitch and decay.
 */
export const renderPluck = (
  sampleRate: number,
  frequency: number,
  config: PluckConfig,
  random: () => number = Math.random
): Float32Array => {
  const length = Math.floor(sampleRate * config.length);
  const out = new Float32Array(length);
  const damping = config.damping ?? 0.5;
  const period = sampleRate / frequency;
  // The loop filter delays by `damping` samples; the delay line makes up the rest
  const delay = Math.max(1.01, period - damping);

  // Excitation: one period of noise, low-passed for brightness, with a comb
  // notch at the pick position (a string can't move where it's plucked from)
  const burst = Math.max(2, Math.round(period));
  const excitation = new Float32Array(burst);
  const smoothing = 0.08 + 0.92 * config.brightness;
  let lowpassed = 0;
  for (let i = 0; i < burst; i += 1) {
    lowpassed += smoothing * (random() * 2 - 1 - lowpassed);
    excitation[i] = lowpassed;
  }
  const pick = Math.round(config.pickPosition * burst);
  if (pick > 0) {
    for (let i = burst - 1; i >= pick; i -= 1) excitation[i] -= excitation[i - pick];
  }
  let mean = 0;
  for (let i = 0; i < burst; i += 1) mean += excitation[i];
  mean /= burst;
  for (let i = 0; i < burst; i += 1) excitation[i] -= mean;

  // Energy lost per trip round the string, set by the decay time
  const loss = Math.pow(10, -3 / (decayTime(frequency, config.sustain) * frequency));

  const at = (position: number): number => {
    const index = Math.floor(position);
    if (index < 0) return 0;
    const fraction = position - index;
    return out[index] * (1 - fraction) + (index + 1 < length ? out[index + 1] : 0) * fraction;
  };

  let peak = 0;
  for (let n = 0; n < length; n += 1) {
    const back = n - delay;
    const looped = (1 - damping) * at(back) + damping * at(back - 1);
    const sample = (n < burst ? excitation[n] : 0) + loss * looped;
    out[n] = sample;
    const magnitude = Math.abs(sample);
    if (magnitude > peak) peak = magnitude;
  }

  // Even loudness across the neck
  if (peak > 0) {
    const gain = 0.85 / peak;
    for (let n = 0; n < length; n += 1) out[n] *= gain;
  }
  return out;
};

const buffers = new Map<string, AudioBuffer>();

/** The rendered note as an AudioBuffer, cached per sound and pitch */
export const getPluckBuffer = (
  ctx: BaseAudioContext,
  cacheKey: string,
  frequency: number,
  config: PluckConfig
): AudioBuffer => {
  const key = `${ctx.sampleRate}:${cacheKey}:${frequency.toFixed(3)}`;
  let buffer = buffers.get(key);
  if (!buffer) {
    const samples = renderPluck(ctx.sampleRate, frequency, config);
    buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
    buffer.getChannelData(0).set(samples);
    buffers.set(key, buffer);
  }
  return buffer;
};
