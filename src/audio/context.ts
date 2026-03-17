export type ActiveVoice = {
  stop: (time?: number) => void;
};

export const activeVoices = new Set<ActiveVoice>();

/**
 * Tracks the most recent active voice per semitone for voice stealing.
 * When the same pitch is retriggered, the previous voice is stopped before
 * the new one starts — preventing volume doubling and wasted AudioNodes.
 */
export const voicesByNote = new Map<number, ActiveVoice>();

/** Hard polyphony ceiling. Oldest voice is evicted when this is exceeded. */
export const MAX_POLYPHONY = 16;

let audioCtx: AudioContext | null = null;
let primed = false;

/**
 * Get or create the AudioContext. Safe to call synchronously from a user-gesture
 * handler — the context is created here, within the gesture call stack.
 */
export const getAudioContext = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext!)();
  }
  return audioCtx;
};

/**
 * Play a zero-gain oscillator for 10ms to flush the OS audio pipeline.
 * Without this, the very first real note takes 50–100ms to reach the speakers
 * (hardware cold-start), causing perceived jank on first playback.
 */
const primeAudioPipeline = (ctx: AudioContext): void => {
  if (primed) return;
  primed = true;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.01);
  } catch { /* ignore — only a best-effort warmup */ }
};

/**
 * Ensure the AudioContext is running and the audio pipeline is warm.
 * MUST be called from (or right before) an async user-gesture handler so the
 * synchronous `getAudioContext()` inside runs within the gesture call stack.
 */
export const ensureAudioInitialized = async (): Promise<void> => {
  const ctx = getAudioContext(); // synchronous — must happen within user gesture
  if (ctx.state !== 'running') {
    try {
      await ctx.resume();
    } catch (error) {
      console.warn('AudioContext resume failed:', error);
      throw error;
    }
  }
  primeAudioPipeline(ctx);
};

export const getCurrentTime = (): number => getAudioContext().currentTime;

export const stopAllAudio = (): void => {
  const now = getCurrentTime();
  activeVoices.forEach((voice) => {
    try { voice.stop(now); } catch { /* noop */ }
  });
};
