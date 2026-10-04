import { envelopeLevelAt, envelopeTimes, layerEnvelope, SILENT, stopPlan } from './envelope';
import { SOUND_PRESETS } from './presets';
import { VOICE_STOP_RAMP_SEC } from '@/constants';

const bells = SOUND_PRESETS.bells.masterEnvelope; // attack 0.002, decay 0.4, release 2
const organ = SOUND_PRESETS.organ.masterEnvelope; // attack 0.025, decay 0.1, release 0.4

describe('envelopeTimes', () => {
  it('fades out over the tail of a note long enough to hold its release', () => {
    expect(envelopeTimes(10, 1.04, organ)).toEqual({
      start: 10,
      attackEnd: 10.025,
      decayEnd: 10.125,
      releaseStart: expect.closeTo(10.64, 6),
      end: expect.closeTo(11.04, 6),
    });
  });

  it('rings a short note on through its whole release instead of cutting it', () => {
    // 300 bpm: a 0.24 s note, shorter than the bell's attack and decay
    const times = envelopeTimes(10, 0.24, bells);
    expect(times.releaseStart).toBeCloseTo(10.402, 6);
    expect(times.end).toBeCloseTo(12.402, 6);
  });

  it('lasts the longer of the note and attack + decay + release', () => {
    for (const { masterEnvelope: env } of Object.values(SOUND_PRESETS)) {
      for (const duration of [0.2, 0.24, 0.6, 1.04, 2.4]) {
        const { end } = envelopeTimes(0, duration, env);
        expect(end).toBeCloseTo(Math.max(duration, env.attack + env.decay + env.release), 9);
      }
    }
  });

  it('never ends in a zero-length release', () => {
    const times = envelopeTimes(0, 0.2, { ...organ, release: 0 });
    expect(times.end - times.releaseStart).toBeGreaterThan(0.004);
  });
});

describe('envelopeLevelAt', () => {
  it('rises to the peak, decays to the sustain and reaches silence at the end', () => {
    const times = envelopeTimes(0, 0.24, bells);
    expect(envelopeLevelAt(bells, times, -0.1)).toBe(SILENT);
    expect(envelopeLevelAt(bells, times, 0)).toBeCloseTo(SILENT, 9);
    expect(envelopeLevelAt(bells, times, 0.001)).toBeCloseTo(0.45, 3);
    expect(envelopeLevelAt(bells, times, times.attackEnd)).toBeCloseTo(0.9, 9);
    expect(envelopeLevelAt(bells, times, times.decayEnd)).toBeCloseTo(0.3, 9);
    // Exponential: halfway through the release it is the geometric mean
    const midRelease = (times.releaseStart + times.end) / 2;
    expect(envelopeLevelAt(bells, times, midRelease)).toBeCloseTo(Math.sqrt(0.3 * SILENT), 9);
    expect(envelopeLevelAt(bells, times, times.end)).toBe(SILENT);
  });

  it('holds the sustain until the release of a long note', () => {
    const times = envelopeTimes(0, 1.04, organ);
    expect(envelopeLevelAt(organ, times, 0.5)).toBeCloseTo(0.8, 9);
  });

  it('holds the peak when the sustain is the peak', () => {
    const flat = { attack: 0.01, attackLevel: 0.9, decay: 0.05, sustain: 0.9, release: 0.1 };
    const times = envelopeTimes(0, 1, flat);
    expect(envelopeLevelAt(flat, times, 0.03)).toBeCloseTo(0.9, 9);
    expect(envelopeLevelAt(flat, times, 0.5)).toBeCloseTo(0.9, 9);
  });

  it('follows an exponential attack', () => {
    const env = { ...organ, attackCurve: 'exponential' as const };
    const times = envelopeTimes(0, 1, env);
    expect(envelopeLevelAt(env, times, 0.0125)).toBeCloseTo(Math.sqrt(SILENT * 0.9), 9);
  });
});

describe('layerEnvelope', () => {
  it('scales the sustain by the layer gain, not just the attack peak', () => {
    // The organ's fifth harmonic: a quiet partial all the way through
    const fifth = SOUND_PRESETS.organ.layers[3];
    expect(layerEnvelope(organ, fifth)).toEqual({
      ...organ,
      attackLevel: expect.closeTo(0.9 * 0.18, 9),
      sustain: expect.closeTo(0.8 * 0.18, 9),
    });
  });

  it('scales the layer’s own levels and keeps its own timing', () => {
    const [, partial] = SOUND_PRESETS.bells.layers; // gain 0.6, decay 0.3, sustain 0.2
    const envelope = layerEnvelope(bells, partial);
    expect(envelope.decay).toBe(0.3);
    expect(envelope.release).toBe(2);
    expect(envelope.attackLevel).toBeCloseTo(0.9 * 0.6, 9);
    expect(envelope.sustain).toBeCloseTo(0.2 * 0.6, 9);
  });
});

describe('stopPlan', () => {
  const voice = { start: 10, end: 12 };

  it('never sounds a voice stopped before it starts', () => {
    expect(stopPlan(voice, 9.98, 9.98)).toEqual({ kind: 'never' });
    // Stolen at a later note's start that is still before this one's
    expect(stopPlan(voice, 9.99, 9.9)).toEqual({ kind: 'never' });
  });

  it('fades a sounding voice out quickly, from when it was asked to stop', () => {
    expect(stopPlan(voice, 10.5, 10.5)).toEqual({ kind: 'fade', at: 10.5, silentAt: 10.5 + VOICE_STOP_RAMP_SEC });
    // A time that has passed means now
    expect(stopPlan(voice, 10.2, 10.5)).toEqual({ kind: 'fade', at: 10.5, silentAt: 10.5 + VOICE_STOP_RAMP_SEC });
    // Voice stealing fades at the new note's start, not when it is scheduled
    expect(stopPlan(voice, 11, 10.9)).toEqual({ kind: 'fade', at: 11, silentAt: 11 + VOICE_STOP_RAMP_SEC });
  });

  it('leaves a voice that has rung out alone', () => {
    expect(stopPlan(voice, 12, 11.9)).toEqual({ kind: 'done' });
    expect(stopPlan(voice, 11, 12.3)).toEqual({ kind: 'done' });
  });
});
