import { act, renderHook } from '@testing-library/react';
import { usePlayback } from '@/hooks/usePlayback';
import { setFormState } from '@/store';
import { scheduler } from '@/scheduler';
import { stopAllAudio, stopVoicesStartingAfter } from '@/audio';
import { AUDIO_LOOKAHEAD_SEC, STRUM_GAP_MS, STRUM_NOTE_MS } from '@/constants';
import { toneAnimationManager } from '@/lib/tone-animation';

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
    strumNow: vi.fn(),
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

describe('usePlayback at the end of a single pass', () => {
  beforeEach(() => {
    audioNow = 0;
    vi.clearAllMocks();
    vi.useFakeTimers();
    setFormState({
      scale: 'major', tone: 'e', phraseLoop: false, phraseDescend: true,
      selectedPosition: null, bpm: 300, swing: false,
    });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const sessions = () => vi.mocked(scheduler.startPhraseSession).mock.calls;

  it('lets the closing note ring instead of cutting it', async () => {
    const { result } = renderHook(() => usePlayback());
    await act(async () => { await result.current.togglePlay(); });
    const cutsAtPlay = vi.mocked(stopAllAudio).mock.calls.length;

    act(() => { vi.advanceTimersByTime(60_000); });
    expect(result.current.isPlaying).toBe(false);
    expect(stopAllAudio).toHaveBeenCalledTimes(cutsAtPlay);
  });

  it('goes round again when Loop is turned on during the last note', async () => {
    const { result } = renderHook(() => usePlayback());
    await act(async () => { await result.current.togglePlay(); });
    const [once] = sessions()[0];
    const closing = once[once.length - 1];

    // The run is back on the tonic it started from
    audioNow = closing.startTimeSec + 0.05;
    act(() => setFormState({ phraseLoop: true }));

    expect(sessions()).toHaveLength(2);
    const [looped, , , loopDuration, startIndex] = sessions()[1];
    // That tonic was the loop's first note: on with the second, on the next beat
    expect(looped[0].abs).toBe(closing.abs);
    expect(startIndex).toBe(1);
    expect(looped[1].startTimeSec).toBeCloseTo(closing.startTimeSec + 0.2, 6);
    expect(loopDuration).toBeCloseTo(looped.length * 0.2, 6);

    act(() => { vi.advanceTimersByTime(60_000); });
    expect(result.current.isPlaying).toBe(true);
  });
});

describe('usePlayback next-note cue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    setFormState({
      scale: 'major', tone: 'e', phraseLoop: true, selectedPosition: null, bpm: 300, swing: false,
      flashMode: 'fret', showNextNote: true,
    });
  });

  const spies = () => ({
    cueAt: vi.spyOn(toneAnimationManager, 'cueAt'),
    cueTone: vi.spyOn(toneAnimationManager, 'cueTone'),
    cueStep: vi.spyOn(toneAnimationManager, 'cueStep'),
  });

  it('marks the next fret and phrase step for the length of the current step', () => {
    const { cueAt, cueStep } = spies();
    const { result } = renderHook(() => usePlayback());
    const [first, second] = result.current.events;
    act(() => result.current.playNote(first.abs, 240, first));
    expect(cueAt).toHaveBeenCalledWith(second.stringIndex, second.fret, 200);
    expect(cueStep).toHaveBeenCalledWith(1, 200);
  });

  it('cues the first note after the last when looping, and nothing after a single pass', () => {
    const { cueAt, cueStep } = spies();
    const { result } = renderHook(() => usePlayback());
    const looped = result.current.events;
    act(() => result.current.playNote(looped[looped.length - 1].abs, 240, looped[looped.length - 1]));
    expect(cueAt).toHaveBeenCalledWith(looped[0].stringIndex, looped[0].fret, 200);
    expect(cueStep).toHaveBeenCalledWith(0, 200);

    cueAt.mockClear();
    cueStep.mockClear();
    act(() => setFormState({ phraseLoop: false }));
    const once = result.current.events;
    act(() => result.current.playNote(once[once.length - 1].abs, 240, once[once.length - 1]));
    expect(cueAt).not.toHaveBeenCalled();
    expect(cueStep).not.toHaveBeenCalled();
  });

  it('cues by pitch when notes are not fingered', () => {
    setFormState({ flashMode: 'all' });
    const { cueAt, cueTone } = spies();
    const { result } = renderHook(() => usePlayback());
    const [first, second] = result.current.events;
    act(() => result.current.playNote(first.abs, 240, first));
    expect(cueTone).toHaveBeenCalledWith(second.abs, 200);
    expect(cueAt).not.toHaveBeenCalled();
  });

  it('cues nothing when turned off, or for a fret click', () => {
    const { cueAt, cueTone, cueStep } = spies();
    const { result } = renderHook(() => usePlayback());
    act(() => result.current.playNote(0, 300, undefined, { stringIndex: 5, fret: 0 }));
    act(() => setFormState({ showNextNote: false }));
    const [first] = result.current.events;
    act(() => result.current.playNote(first.abs, 240, first));
    expect(cueAt).not.toHaveBeenCalled();
    expect(cueTone).not.toHaveBeenCalled();
    expect(cueStep).not.toHaveBeenCalled();
  });
});

// Standard tuning at octave 4: the lowest C on the neck is abs -16 (low E
// string, fret 8). C major's ii is D F A, 2 / 5 / 9 semitones above it.
describe('usePlayback chord practice', () => {
  beforeEach(() => {
    audioNow = 0;
    vi.clearAllMocks();
    setFormState({
      scale: 'major', tone: 'c', tuningName: 'Standard', strings: 6, frets: 24, startOctave: 4,
      flashMode: 'fret', phraseMode: 'thirds', phraseOctaves: 1, phraseDescend: false, phraseLoop: false,
      selectedPosition: null, positionSpan: 5, selectedChordDegree: 2, chordSevenths: false,
      arpShape: 'straight', bpm: 300, swing: false, soundType: 'marimba',
    });
  });
  afterEach(() => {
    setFormState({ selectedChordDegree: null, selectedPosition: null });
  });

  const played = (result: { current: ReturnType<typeof usePlayback> }) =>
    result.current.events.map((event) => event.abs);

  it('arpeggiates the chord instead of the pattern', () => {
    const { result } = renderHook(() => usePlayback());
    expect(played(result)).toEqual([-14, -11, -7]);
  });

  it('adds the 7th, and follows the shape', () => {
    setFormState({ chordSevenths: true });
    const { result } = renderHook(() => usePlayback());
    expect(played(result)).toEqual([-14, -11, -7, -4]);
    act(() => setFormState({ arpShape: 'skips' }));
    expect(played(result)).toEqual([-14, -7, -11, -4, -7, -2]);
  });

  it('goes back to the pattern when the chord is let go', () => {
    const { result } = renderHook(() => usePlayback());
    act(() => setFormState({ selectedChordDegree: null }));
    // Thirds in C: C E, D F, E G …
    expect(played(result).slice(0, 4)).toEqual([-16, -12, -14, -11]);
  });

  it("plays only the chord's tones in a selected position, where they lie", () => {
    // Position 2 spans frets 1–5; D F A in it, string by string
    setFormState({ selectedPosition: 2 });
    const { result } = renderHook(() => usePlayback());
    expect(result.current.events.map((event) => [event.stringIndex, event.fret])).toEqual([
      [0, 1], [0, 5], [1, 5], [2, 3], [3, 2], [4, 3], [5, 1], [5, 5],
    ]);
    expect(played(result)).toEqual([-23, -19, -14, -11, -7, -2, 1, 5]);
  });

  it('strums a picked chord from its root to the octave, low to high', async () => {
    const { result } = renderHook(() => usePlayback());
    await act(async () => { await result.current.strumChord(5); });
    // G B D G
    expect(scheduler.strumNow).toHaveBeenCalledWith(
      [-9, -5, -2, 3], STRUM_GAP_MS, STRUM_NOTE_MS, 'marimba', expect.any(Function)
    );
    act(() => setFormState({ chordSevenths: true }));
    await act(async () => { await result.current.strumChord(5); });
    // G B D F G
    expect(vi.mocked(scheduler.strumNow).mock.calls[1][0]).toEqual([-9, -5, -2, 1, 3]);
  });

  it('leaves a running arpeggio to move on to the chord by itself', async () => {
    const { result } = renderHook(() => usePlayback());
    await act(async () => { await result.current.togglePlay(); });
    await act(async () => { await result.current.strumChord(5); });
    expect(scheduler.strumNow).not.toHaveBeenCalled();
  });
});
