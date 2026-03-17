/**
 * Cached impulse response buffers keyed by "sampleRate-roomSize-damping".
 * Generating a reverb IR involves O(sampleRate × roomSize × 3 × 2) float ops —
 * up to 211,680 per note for synth-pad. Caching makes it O(1) after the first note.
 */
const reverbBufferCache = new Map<string, AudioBuffer>();

export const createReverb = (
  ctx: AudioContext,
  config: { roomSize: number; damping: number; wet: number },
): ConvolverNode => {
  const sampleRate = ctx.sampleRate;
  const cacheKey = `${sampleRate}-${config.roomSize}-${config.damping}`;

  let impulse = reverbBufferCache.get(cacheKey);
  if (!impulse) {
    const length = Math.floor(sampleRate * config.roomSize * 3);
    impulse = ctx.createBuffer(2, length, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - config.damping, i / sampleRate);
        data[i] = (Math.random() * 2 - 1) * decay * Math.pow(1 - i / length, 2);
      }
    }
    reverbBufferCache.set(cacheKey, impulse);
  }

  const convolver = ctx.createConvolver();
  convolver.buffer = impulse;
  return convolver;
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
