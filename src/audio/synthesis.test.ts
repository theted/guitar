import { describe, it, expect } from 'vitest';
import { semitoneToFrequency, synthesizeSound } from './synthesis';
import { activeVoices, voicesByNote, MAX_POLYPHONY, setReverbLevel } from './context';
import { envelopeTimes, SILENT } from './envelope';
import { DEFAULT_ROOM_SEND } from './effects';
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

// jsdom has no Web Audio; the buses are the only things needing a real context
const buses = vi.hoisted(() => {
  const bus = () => ({ connect: () => {}, disconnect: () => {} });
  return { master: bus(), reverb: bus() };
});
vi.mock('./context', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./context')>()),
  getMasterBus: () => buses.master,
  getReverbBus: () => buses.reverb,
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
  /** Where this node's output goes */
  outputs = new Set<unknown>();
  disconnected = false;
  connect(target: unknown) { this.outputs.add(target); }
  disconnect() {
    this.disconnected = true;
    this.outputs.clear();
  }
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

type FakeGain = FakeNode & { gain: FakeParam };

const fakeContext = ({ cancelAndHold = true } = {}) => {
  const gains: FakeGain[] = [];
  const sources: FakeSource[] = [];
  const convolvers: FakeNode[] = [];
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
    createConvolver: () => {
      const node = Object.assign(new FakeNode(), { buffer: null });
      convolvers.push(node);
      return node;
    },
    createWaveShaper: () => Object.assign(new FakeNode(), { curve: null, oversample: 'none' }),
    createDelay: () => Object.assign(new FakeNode(), { delayTime: param() }),
    createBuffer: (_channels: number, length: number) => ({ getChannelData: () => new Float32Array(length) }),
  };
  /** Gains with an envelope, master first then one per layer (effect gains only set a value) */
  const envelopeNodes = () => gains.filter((node) => node.gain.events.length > 0);
  return {
    ctx,
    sources,
    convolvers,
    /** The gains feeding `target` */
    gainsInto: (target: unknown) => gains.filter((node) => node.outputs.has(target)),
    envelopeNodes,
    envelopes: () => envelopeNodes().map((node) => node.gain),
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

describe('the shared reverb', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    activeVoices.clear();
    voicesByNote.clear();
  });
  afterEach(() => {
    setReverbLevel(1);
    vi.useRealTimers();
  });

  const close = (value: number) => expect.closeTo(value, 9);

  it('sends every voice of a sound into one room, after the voice envelope', () => {
    const audio = fakeContext();
    audio.play('acoustic-steel', 0, 0.24, 0);
    audio.play('acoustic-steel', 0.1, 0.24, 4);
    expect(audio.convolvers).toHaveLength(1);
    const [room] = audio.convolvers;
    expect([...room.outputs]).toEqual([buses.reverb]);

    // Each voice: envelope → dry (1 − wet) → master bus, and envelope → send (wet) → room.
    // Fed from the envelope, a send is silent whenever its voice is.
    const sends = audio.gainsInto(room);
    const dries = audio.gainsInto(buses.master);
    expect(sends.map((node) => node.gain.value)).toEqual([0.14, 0.14]);
    expect(dries.map((node) => node.gain.value)).toEqual([close(0.86), close(0.86)]);
    audio.envelopeNodes().forEach((master, i) => {
      expect([...master.outputs]).toEqual([dries[i], sends[i]]);
    });
  });

  it('puts sounds without a room of their own in the default room, at full level', () => {
    const audio = fakeContext();
    audio.play('sine', 0, 0.5, 0);
    // The nylon guitar's room is the default room
    audio.play('acoustic-nylon', 0, 0.5, 2);
    audio.play('bells', 0, 0.5, 4);
    expect(audio.convolvers).toHaveLength(2);
    const [shared, bells] = audio.convolvers;
    expect(audio.gainsInto(shared).map((node) => node.gain.value)).toEqual([DEFAULT_ROOM_SEND, 0.16]);
    expect(audio.gainsInto(bells).map((node) => node.gain.value)).toEqual([0.3]);
    expect(audio.gainsInto(buses.master).map((node) => node.gain.value)).toEqual([1, close(0.84), close(0.7)]);
  });

  it('lets the room ring on when a voice ends: only the voice’s own nodes are disconnected', () => {
    const audio = fakeContext();
    const voice = audio.play('acoustic-steel', 0, 1);
    const [room] = audio.convolvers;
    const [send] = audio.gainsInto(room);
    const [dry] = audio.gainsInto(buses.master);

    audio.ctx.currentTime = 0.5;
    voice.stop();
    vi.advanceTimersByTime(VOICE_STOP_RAMP_SEC * 1000 + 60);
    expect(send.disconnected).toBe(true);
    expect(dry.disconnected).toBe(true);
    expect(room.disconnected).toBe(false);

    // The next note goes into the same room, and rings out on its own
    audio.play('acoustic-steel', 1, 1);
    expect(audio.gainsInto(room)).toHaveLength(1);
    vi.runAllTimers();
    expect(audio.gainsInto(room)).toHaveLength(0);
    expect(audio.convolvers).toEqual([room]);
    expect(room.disconnected).toBe(false);
    expect([...room.outputs]).toEqual([buses.reverb]);
  });

  it('sends nothing, and builds no reverb, with the room turned off', () => {
    setReverbLevel(0);
    const audio = fakeContext();
    audio.play('synth-pad', 0, 1);
    expect(audio.convolvers).toHaveLength(0);
    expect(audio.gainsInto(buses.master).map((node) => node.gain.value)).toEqual([close(0.6)]);
  });
});
