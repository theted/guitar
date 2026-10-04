// The buses, on a stand-in AudioContext (jsdom has no Web Audio)
type Automation = { type: string; value?: number; time: number };

class FakeParam {
  events: Automation[] = [];
  constructor(public value = 1) {}
  setValueAtTime(value: number, time: number) { this.events.push({ type: 'set', value, time }); }
  linearRampToValueAtTime(value: number, time: number) { this.events.push({ type: 'linear', value, time }); }
  cancelScheduledValues(time: number) { this.events.push({ type: 'cancel', time }); }
}

class FakeGain {
  gain = new FakeParam();
  outputs: unknown[] = [];
  connect(target: unknown) { this.outputs.push(target); }
}

class FakeAudioContext {
  currentTime = 0;
  destination = { name: 'destination' };
  createGain() { return new FakeGain(); }
}

type Context = typeof import('./context');

describe('reverb return bus', () => {
  let audio: Context;
  beforeEach(async () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    vi.resetModules();
    audio = await import('./context');
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('feeds the master bus, so volume and mute reach tails', () => {
    const bus = audio.getReverbBus() as unknown as FakeGain;
    expect(bus.outputs).toEqual([audio.getMasterBus()]);
    expect(audio.getReverbBus()).toBe(bus);
  });

  it('starts at a level set before it existed', () => {
    audio.setReverbLevel(1.8);
    expect((audio.getReverbBus() as unknown as FakeGain).gain.value).toBe(1.8);
  });

  it('ramps a new level onto tails already ringing', () => {
    const bus = audio.getReverbBus() as unknown as FakeGain;
    const ctx = audio.getAudioContext() as unknown as FakeAudioContext;
    ctx.currentTime = 2;
    audio.setReverbLevel(0.5);
    expect(bus.gain.events).toEqual([
      { type: 'cancel', time: 2 },
      { type: 'set', value: 1, time: 2 },
      { type: 'linear', value: 0.5, time: expect.closeTo(2.02, 9) },
    ]);
    expect(audio.getReverbLevel()).toBe(0.5);
  });

  it('never goes below zero, and treats nonsense as the designed level', () => {
    audio.setReverbLevel(-1);
    expect(audio.getReverbLevel()).toBe(0);
    audio.setReverbLevel(Number.NaN);
    expect(audio.getReverbLevel()).toBe(1);
  });
});
