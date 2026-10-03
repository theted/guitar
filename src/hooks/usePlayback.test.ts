import { act, renderHook } from '@testing-library/react';
import { usePlayback } from '@/hooks/usePlayback';
import { setFormState } from '@/store';

// No Web Audio in jsdom: the scheduler and audio layer are stand-ins
vi.mock('@/audio', () => ({
  ensureAudioInitialized: vi.fn(async () => {}),
  stopAllAudio: vi.fn(),
  getCurrentTime: vi.fn(() => 0),
}));
vi.mock('@/scheduler', () => ({
  scheduler: {
    startPhraseSession: vi.fn(() => 1),
    stopSession: vi.fn(),
    stopAll: vi.fn(),
  },
}));

describe('usePlayback stop', () => {
  beforeEach(() => {
    setFormState({ scale: 'major', tone: 'e', phraseLoop: true, selectedPosition: null });
  });

  const play = async (result: { current: ReturnType<typeof usePlayback> }) => {
    await act(async () => { await result.current.togglePlay(); });
  };

  it('resets the play button every time, not just the first', async () => {
    const { result } = renderHook(() => usePlayback());

    // The old stop-signal bookkeeping swallowed the first stop after a play
    // started from idle; play → stop twice in a row covers that path
    for (let round = 0; round < 2; round += 1) {
      await play(result);
      expect(result.current.isPlaying).toBe(true);
      act(() => result.current.stopAllPlayback());
      expect(result.current.isPlaying).toBe(false);
    }
  });

  it('is safe to call while idle', () => {
    const { result } = renderHook(() => usePlayback());
    act(() => result.current.stopAllPlayback());
    expect(result.current.isPlaying).toBe(false);
  });

  it('keeps a stable identity across renders, so controls do not re-render', async () => {
    const { result, rerender } = renderHook(() => usePlayback());
    const first = result.current.stopAllPlayback;
    await play(result);
    rerender();
    expect(result.current.stopAllPlayback).toBe(first);
  });
});
