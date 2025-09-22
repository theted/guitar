let audioCtx: AudioContext | null = null;

export type SoundType = 'marimba' | 'sine' | 'organ' | 'piano' | 'square' | 'saw';

export const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    try { audioCtx.resume(); } catch {}
  } else { try { audioCtx.resume(); } catch {} }
  return audioCtx;
};

const semitoneToFrequency = (semitoneFromE0: number): number => {
  // Our tones array starts at 'e'. Index of 'a' is 5, so distance from A4 (440Hz):
  // semitone distance from A = (semitone - 5)
  const distanceFromA = semitoneFromE0 - 5;
  return 440 * Math.pow(2, distanceFromA / 12);
};

export const getCurrentTime = (): number => getAudioContext().currentTime;

export const playSemitoneAt = (
  semitoneFromE0: number,
  startAtTime: number,
  opts?: { duration?: number; type?: SoundType }
) => {
  const ctx = getAudioContext();
  const duration = opts?.duration ?? 1.2;
  const freq = semitoneToFrequency(semitoneFromE0);

  // Master gain
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, startAtTime);
  master.gain.exponentialRampToValueAtTime(0.8, startAtTime + 0.005);
  master.gain.exponentialRampToValueAtTime(0.0001, startAtTime + duration);
  master.connect(ctx.destination);

  const type = opts?.type ?? 'marimba';

  if (type === 'marimba') {
    // Simple marimba-like: base sine + higher partial with fast decay + slight bandpass
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq * 2;
    bp.Q.value = 6;
    bp.connect(master);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = freq;
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.0001, startAtTime);
    g1.gain.exponentialRampToValueAtTime(0.9, startAtTime + 0.004);
    g1.gain.exponentialRampToValueAtTime(0.0001, startAtTime + duration);
    osc1.connect(g1).connect(bp);

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = freq * 2.67; // bright partial
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.0001, startAtTime);
    g2.gain.exponentialRampToValueAtTime(0.4, startAtTime + 0.003);
    g2.gain.exponentialRampToValueAtTime(0.0001, startAtTime + duration * 0.6);
    osc2.connect(g2).connect(bp);

    osc1.start(startAtTime); osc2.start(startAtTime);
    osc1.stop(startAtTime + duration); osc2.stop(startAtTime + duration);
  } else if (type === 'sine') {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startAtTime);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, startAtTime);
    g.gain.exponentialRampToValueAtTime(0.9, startAtTime + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, startAtTime + duration);
    osc.connect(g).connect(master);
    osc.start(startAtTime); osc.stop(startAtTime + duration);
  } else if (type === 'organ') {
    // Additive sines (1f, 2f, 3f, 5f) with slow attack and long sustain
    const partials = [1, 2, 3, 5];
    const gains = [0.8, 0.4, 0.25, 0.18];
    const out = ctx.createGain();
    out.connect(master);
    out.gain.setValueAtTime(0.0001, startAtTime);
    out.gain.linearRampToValueAtTime(0.9, startAtTime + 0.025);
    out.gain.exponentialRampToValueAtTime(0.0001, startAtTime + duration);
    partials.forEach((p, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * p;
      const g = ctx.createGain();
      g.gain.setValueAtTime(gains[i], startAtTime);
      g.gain.exponentialRampToValueAtTime(0.0001, startAtTime + duration);
      osc.connect(g).connect(out);
      osc.start(startAtTime);
      osc.stop(startAtTime + duration);
    });
  } else if (type === 'piano') {
    // Simple piano-ish: triangle + slightly detuned sine + lowpass, fast attack, medium decay
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = Math.min(8000, freq * 6);
    lp.Q.value = 0.8;
    lp.connect(master);

    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.value = freq;
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.0001, startAtTime);
    g1.gain.linearRampToValueAtTime(0.9, startAtTime + 0.005);
    g1.gain.exponentialRampToValueAtTime(0.0001, startAtTime + duration);
    osc1.connect(g1).connect(lp);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 1.005; // slight detune
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.0001, startAtTime);
    g2.gain.linearRampToValueAtTime(0.4, startAtTime + 0.004);
    g2.gain.exponentialRampToValueAtTime(0.0001, startAtTime + duration * 0.7);
    osc2.connect(g2).connect(lp);

    osc1.start(startAtTime); osc2.start(startAtTime);
    osc1.stop(startAtTime + duration); osc2.stop(startAtTime + duration);
  } else if (type === 'square' || type === 'saw') {
    const osc = ctx.createOscillator();
    osc.type = type as OscillatorType;
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, startAtTime);
    g.gain.linearRampToValueAtTime(0.7, startAtTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, startAtTime + duration);
    osc.connect(g).connect(master);
    osc.start(startAtTime); osc.stop(startAtTime + duration);
  } else {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, startAtTime);
    gain.gain.exponentialRampToValueAtTime(0.8, startAtTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAtTime + duration);
    osc.connect(gain).connect(master);
    osc.start(startAtTime);
    osc.stop(startAtTime + duration);
  }
};

export const playSemitone = (semitoneFromE0: number, opts?: { duration?: number; type?: SoundType }) => {
  const ctx = getAudioContext();
  playSemitoneAt(semitoneFromE0, ctx.currentTime, opts);
};
