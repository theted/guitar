import { DEFAULT_ROOM, DEFAULT_ROOM_SEND, REVERB_LEVELS, reverbRouting } from './effects';
import { SOUND_PRESETS, type SoundType } from './presets';

describe('reverbRouting', () => {
  it('keeps the balance a sound with its own reverb was designed with', () => {
    expect(reverbRouting(SOUND_PRESETS['acoustic-steel'])).toEqual({
      room: { roomSize: 0.35, damping: 0.45 },
      send: 0.14,
      dry: expect.closeTo(0.86, 9),
    });
    expect(reverbRouting(SOUND_PRESETS['synth-pad'])).toEqual({
      room: { roomSize: 0.8, damping: 0.3 },
      send: 0.4,
      dry: expect.closeTo(0.6, 9),
    });
  });

  it('sends a sound without one a little into the default room, at full level', () => {
    expect(reverbRouting(SOUND_PRESETS.sine)).toEqual({ room: DEFAULT_ROOM, send: DEFAULT_ROOM_SEND, dry: 1 });
    expect(reverbRouting(SOUND_PRESETS['guitar-distorted'])).toEqual({ room: DEFAULT_ROOM, send: DEFAULT_ROOM_SEND, dry: 1 });
    expect(reverbRouting({})).toEqual({ room: DEFAULT_ROOM, send: DEFAULT_ROOM_SEND, dry: 1 });
  });

  it('is a gentle room, shared with the nylon guitar', () => {
    expect(DEFAULT_ROOM).toEqual({ roomSize: 0.3, damping: 0.5 });
    expect(DEFAULT_ROOM_SEND).toBe(0.1);
    expect(reverbRouting(SOUND_PRESETS['acoustic-nylon']).room).toEqual(DEFAULT_ROOM);
  });

  it('puts every sound in a room, and only the designed reverbs below full dry level', () => {
    const routes = Object.fromEntries(
      (Object.keys(SOUND_PRESETS) as SoundType[]).map((sound) => {
        const { send, dry } = reverbRouting(SOUND_PRESETS[sound]);
        return [sound, [send, Number(dry.toFixed(2))]];
      }),
    );
    expect(routes).toEqual({
      sine: [0.1, 1],
      square: [0.1, 1],
      saw: [0.1, 1],
      marimba: [0.1, 1],
      organ: [0.1, 1],
      piano: [0.1, 1],
      'acoustic-steel': [0.14, 0.86],
      'acoustic-nylon': [0.16, 0.84],
      'guitar-clean': [0.12, 0.88],
      'guitar-distorted': [0.1, 1],
      'guitar-muted': [0.1, 1],
      bass: [0.1, 1],
      'bass-picked': [0.1, 1],
      'synth-lead': [0.1, 1],
      'synth-pad': [0.4, 0.6],
      bells: [0.3, 0.7],
      strings: [0.25, 0.75],
      flute: [0.2, 0.8],
      brass: [0.15, 0.85],
    });
  });
});

describe('REVERB_LEVELS', () => {
  it('runs from none to more than designed, with normal as designed', () => {
    expect(REVERB_LEVELS).toEqual({ off: 0, low: 0.5, normal: 1, high: 1.8 });
  });
});
