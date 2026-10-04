import { describe, it, expect } from 'vitest';
import { semitoneToFrequency, synthesizeSound } from './synthesis';
import { activeVoices, voicesByNote, MAX_POLYPHONY } from './context';
import { envelopeTimes, SILENT } from './envelope';
import { SOUND_PRESETS, type SoundType } from './presets';
import { VOICE_CLEANUP_EXTRA_MS, VOICE_STOP_RAMP_SEC } from '@/constants';

// The anchor: semitone 5 from E (= A4) maps to 440 Hz.
// Formula: 440 * 2^((n - 5) / 12)
describe('semitoneToFrequency', () => {
  it('returns 440 Hz for A4 (semitone 5 from E)', () => {
    expect(semitoneToFrequency(5)).toBeCloseTo(440, 2);
  });

  it('returns an octave up for +12 semitones', () => {
    expect(semitoneToFrequency(17)).toBeCloseTo(880, 2); // A5
  });

  it('returns an octave down for -12 semitones', () => {
    expect(semitoneToFrequency(-7)).toBeCloseTo(220, 2); // A3
  });

  it('returns ~329.63 Hz for E4 (semitone 0)', () => {
    expect(semitoneToFrequency(0)).toBeCloseTo(329.63, 1);
  });

  it('each semitone step multiplies frequency by the 12th root of 2', () => {
    const ratio = semitoneToFrequency(6) / semitoneToFrequency(5);
    expect(ratio).toBeCloseTo(Math.pow(2, 1 / 12), 6);
  });
});

// ─── The voice graph, on a stand-in AudioContext that records automation ────

// jsdom has no Web Audio; the master bus is the only thing needing a real context
vi.mock('./context', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./context')>()),
  getMasterBus: () => ({ connect: () => {}, disconnect: () => {} }),
}));

type Automation = { type: string; value?: number; time: number };

class FakeParam {
  events: Automation[] = [];
  constructor(public value = 1) {}
  setValueAtTime(value: number, time: number) { this.events.push({ type: 'set', value, time }); }
  linearRampToValueAtTime(value: number, time: number) { this.events.push({ type: 'linear', value, time }); }
  exponentialRampToValueAtTime(value: number, time: number) { this.events.push({ type: 'exponential', value, time }); }
  setTargetAtTime(value: number, time: number) { this.events.push({ type: 'target', value, time }); }
  cancelScheduledValues(time: number) { this.events.push({ type: 'cancel', time }); }
  cancelAndHoldAtTime(time: number) { this.events.push({ type: 'hold', time }); }
}

class FakeNode {
  connect() {}
  disconnect() {}
}

class FakeSource extends FakeNode {
  type = '';
  buffer: unknown = null;
  frequency = new FakeParam(440);
  detune = new FakeParam(0);
  started?: number;
  stopped?: number;
  start(time: number) { this.started = time; }
  stop(time: number) { this.stopped = time; }
}

const fakeContext = ({ cancelAndHold = true } = {}) => {
  const gains: { gain: FakeParam }[] = [];
  const sources: FakeSource[] = [];
  const param = (value?: number) => {
    const p = new FakeParam(value);
    if (!cancelAndHold) Object.defineProperty(p, 'cancelAndHoldAtTime', { value: undefined });
    return p;
  };
  const ctx = {
    currentTime: 0,
    sampleRate: 8000,
    createGain: () => {
      const node = Object.assign(new FakeNode(), { gain: param() });
      gains.push(node);
      return node;
    },
    createOscillator: () => {
      const source = new FakeSource();
      sources.push(source);
      return source;
    },
    createBufferSource: () => {
      const source = new FakeSource();
      sources.push(source);
      return source;
    },
    createBiquadFilter: () => Object.assign(new FakeNode(), { type: '', frequency: param(), Q: param() }),
    createConvolver: () => Object.assign(new FakeNode(), { buffer: null }),
    createWaveShaper: () => Object.assign(new FakeNode(), { curve: null, oversample: 'none' }),
    createDelay: () => Object.assign(new FakeNode(), { delayTime: param() }),
    createBuffer: (_channels: number, length: number) => ({ getChannelData: () => new Float32Array(length) }),
  };
  return {
    ctx,
    sources,
    /** Gains with an envelope, master first then one per layer (effect gains only set a value) */
    envelopes: () => gains.map((node) => node.gain).filter((gain) => gain.events.length > 0),
    play: (sound: SoundType, start: number, duration: number, semitone = 0) =>
      synthesizeSound(
        ctx as unknown as AudioContext,
        semitone,
        semitoneToFrequency(semitone),
        start,
        duration,
        SOUND_PRESETS[sound],
        sound,
      ),
  };
};

const last = <T,>(list: T[]) => list[list.length - 1];
const afterIndex = (events: Automation[], type: string) => events.slice(events.findIndex((e) => e.type === type));

describe('synthesizeSound', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    activeVoices.clear();
    voicesByNote.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('stops oscillators only once their envelope has reached silence', () => {
    // 300 bpm: 0.24 s, shorter than the bell's attack and decay
    const audio = fakeContext();
    audio.play('bells', 1, 0.24);
    const [master, ...layers] = audio.envelopes();
    const end = envelopeTimes(1, 0.24, SOUND_PRESETS.bells.masterEnvelope).end;
    expect(end).toBeCloseTo(3.402, 6);
    expect(last(master.events)).toEqual({ type: 'exponential', value: SILENT, time: end });

    expect(audio.sources).toHaveLength(4);
    audio.sources.forEach((osc, i) => {
      const layerEnd = last(layers[i].events);
      expect(layerEnd).toMatchObject({ type: 'exponential', value: SILENT });
      // Not at the end of the step (1.24) but when the sound has died away
      expect(osc.stopped).toBeCloseTo(Math.min(layerEnd.time, end), 9);
    });
  });

  it('keeps a voice registered until it has rung out, not until its step ends', () => {
    const audio = fakeContext();
    const voice = audio.play('bells', 0, 0.24);
    vi.advanceTimersByTime(240 + VOICE_CLEANUP_EXTRA_MS + 50);
    expect(activeVoices.has(voice)).toBe(true);
    vi.advanceTimersByTime(2402 - 240);
    expect(activeVoices.has(voice)).toBe(false);
    expect(voicesByNote.size).toBe(0);
  });

  it('holds each layer at its own share of the sustain', () => {
    const audio = fakeContext();
    audio.play('organ', 0, 1.04);
    const [, ...layers] = audio.envelopes();
    SOUND_PRESETS.organ.layers.forEach((layer, i) => {
      const decay = layers[i].events.find((e) => e.type === 'exponential');
      expect(decay?.value).toBeCloseTo(0.8 * layer.gain, 9);
      expect(decay?.time).toBeCloseTo(0.125, 9);
    });
  });

  it('makes a voice stopped before it starts silent: no unshaped tick', () => {
    const audio = fakeContext();
    // Due within the fade, the case that used to sound at the GainNode default of 1
    const voice = audio.play('organ', 0.02, 0.24);
    voice.stop();
    audio.sources.forEach((osc) => expect(osc.stopped).toBe(0.02));
    audio.envelopes().forEach((gain) => {
      expect(gain.value).toBe(SILENT);
      expect(afterIndex(gain.events, 'cancel')).toEqual([
        { type: 'cancel', time: 0 },
        { type: 'set', value: SILENT, time: 0 },
      ]);
    });
    expect(activeVoices.has(voice)).toBe(false);
  });

  it('fades a sounding voice to zero just as its sources stop', () => {
    const audio = fakeContext();
    const voice = audio.play('organ', 0, 1.04);
    audio.ctx.currentTime = 0.5;
    voice.stop();
    const silentAt = 0.5 + VOICE_STOP_RAMP_SEC;
    audio.envelopes().forEach((gain) => {
      expect(afterIndex(gain.events, 'hold')).toEqual([
        { type: 'hold', time: 0.5 },
        { type: 'linear', value: 0, time: silentAt },
      ]);
    });
    audio.sources.forEach((osc) => expect(osc.stopped).toBe(silentAt));
  });

  it('pins the level reached when the browser has no cancelAndHoldAtTime', () => {
    const audio = fakeContext({ cancelAndHold: false });
    const voice = audio.play('organ', 0, 1.04);
    // Halfway up the organ's 25 ms linear attack
    audio.ctx.currentTime = 0.0125;
    voice.stop();
    const [master] = audio.envelopes();
    expect(afterIndex(master.events, 'cancel')).toEqual([
      { type: 'cancel', time: 0.0125 },
      { type: 'set', value: expect.closeTo(0.45, 3), time: 0.0125 },
      { type: 'linear', value: 0, time: 0.0125 + VOICE_STOP_RAMP_SEC },
    ]);
  });

  it('fades a retriggered pitch out as the new note starts', () => {
    const audio = fakeContext();
    audio.play('organ', 0, 1.04, 7);
    const [first] = audio.envelopes();
    audio.play('organ', 0.5, 1.04, 7);
    expect(afterIndex(first.events, 'hold')).toEqual([
      { type: 'hold', time: 0.5 },
      { type: 'linear', value: 0, time: 0.5 + VOICE_STOP_RAMP_SEC },
    ]);
    expect(voicesByNote.size).toBe(1);
  });

  it(`keeps at most ${MAX_POLYPHONY} voices, fading out the oldest`, () => {
    const audio = fakeContext();
    const voices = Array.from({ length: MAX_POLYPHONY + 1 }, (_, i) => audio.play('sine', i * 0.01, 1, i));
    expect(activeVoices.size).toBe(MAX_POLYPHONY);
    expect(activeVoices.has(voices[0])).toBe(false);
    expect(activeVoices.has(voices[1])).toBe(true);
  });

  it('lets a plucked note ring for three steps, ending with its envelope', () => {
    const audio = fakeContext();
    audio.play('acoustic-steel', 0, 0.24);
    const [master] = audio.envelopes();
    const [source] = audio.sources;
    expect(last(master.events)).toEqual({ type: 'exponential', value: SILENT, time: expect.closeTo(0.72, 9) });
    expect(source.stopped).toBeCloseTo(0.72, 9);
  });
});
