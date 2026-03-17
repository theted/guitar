export const createReverb = (
  ctx: AudioContext,
  config: { roomSize: number; damping: number; wet: number },
): ConvolverNode => {
  const convolver = ctx.createConvolver();
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * config.roomSize * 3;
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

export const createDistortion = (
  ctx: AudioContext,
  config: { drive: number; tone: number; wet: number },
): WaveShaperNode => {
  const shaper = ctx.createWaveShaper();
  const samples = 44100;
  const curve = new Float32Array(samples);
  const deg = Math.PI / 180;

  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + config.drive) * x * 20 * deg) / (Math.PI + config.drive * Math.abs(x));
  }

  shaper.curve = curve;
  shaper.oversample = "4x";
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
