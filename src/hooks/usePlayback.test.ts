import { act, renderHook } from '@testing-library/react';
import { usePlayback } from '@/hooks/usePlayback';
import { setFormState } from '@/store';
import { scheduler } from '@/scheduler';
import { stopAllAudio, stopVoicesStartingAfter } from '@/audio';
import { AUDIO_LOOKAHEAD_SEC } from '@/constants';

// No Web Audio in jsdom: the scheduler and audio layer are stand-ins
let audioNow = 0;
vi.mock('@/audio', () => ({
  ensureAudioInitialized: vi.fn(async () => {}),
  stopAllAudio: vi.fn(),
  stopVoicesStartingAfter: vi.fn(),
  getCurrentTime: vi.fn(() => audioNow),
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
    audioNow = 0;
    vi.clearAllMocks();
    setFormState({ scale: 'major', tone: 'e', phraseLoop: true, selectedPosition: null, bpm: 300, swing: false });
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

describe('usePlayback live changes', () => {
  beforeEach(() => {
    audioNow = 0;
    vi.clearAllMocks();
    setFormState({ scale: 'major', tone: 'e', phraseLoop: true, selectedPosition: null, bpm: 300, swing: false });
  });

  const lastSession = () => {
    const calls = vi.mocked(scheduler.startPhraseSession).mock.calls;
    const [events, , , , startIndex] = calls[calls.length - 1];
    return { events, startIndex: startIndex ?? 0, count: calls.length };
  };

  it('keeps playing through a key change, from the same step on its beat', async () => {
    const { result } = renderHook(() => usePlayback());
    await act(async () => { await result.current.togglePlay(); });
    const first = lastSession();
    const cutsAtPlay = vi.mocked(stopAllAudio).mock.calls.length;

    // 300 bpm = 0.2 s a step; half a second in, step 3 is next
    audioNow = AUDIO_LOOKAHEAD_SEC + 0.5;
    act(() => setFormState({ tone: 'g' }));

    expect(result.current.isPlaying).toBe(true);
    const second = lastSession();
    expect(second.count).toBe(first.count + 1);
    expect(second.startIndex).toBe(3);
    // Step 3 sounds when it was always due: no stall, no rush
    expect(second.events[3].startTimeSec).toBeCloseTo(first.events[3].startTimeSec, 6);
    // The new key, not the old one
    expect(second.events[3].abs).not.toBe(first.events[3].abs);
    // Only notes that hadn't started yet are cut
    expect(stopVoicesStartingAfter).toHaveBeenCalledWith(audioNow);
    expect(stopAllAudio).toHaveBeenCalledTimes(cutsAtPlay);
  });

  it('picks up a new tempo from the next step', async () => {
    const { result } = renderHook(() => usePlayback());
    await act(async () => { await result.current.togglePlay(); });
    audioNow = AUDIO_LOOKAHEAD_SEC + 0.5;
    act(() => setFormState({ bpm: 600 }));

    const { events, startIndex } = lastSession();
    expect(result.current.isPlaying).toBe(true);
    expect(events[startIndex].startTimeSec).toBeCloseTo(AUDIO_LOOKAHEAD_SEC + 0.6, 6);
    expect(events[startIndex + 1].startTimeSec - events[startIndex].startTimeSec).toBeCloseTo(0.1, 6);
  });

  it('does nothing while stopped', () => {
    renderHook(() => usePlayback());
    act(() => setFormState({ tone: 'a' }));
    expect(scheduler.startPhraseSession).not.toHaveBeenCalled();
  });
});
