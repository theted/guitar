import { SOUND_GROUPS } from './options';
import { SOUND_PRESETS } from '@/audio/presets';

describe('SOUND_GROUPS', () => {
  it('offers every sound exactly once', () => {
    const offered = SOUND_GROUPS.flatMap((group) => group.options.map((option) => option.value));
    expect([...offered].sort()).toEqual(Object.keys(SOUND_PRESETS).sort());
    expect(new Set(offered).size).toBe(offered.length);
  });
});
