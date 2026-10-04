import { act, renderHook } from '@testing-library/react';
import { nextStep, resumePoint, usePhrasePlayer, type PhraseRun } from './usePhrasePlayer';
import type { PhraseEvent } from './usePhraseEvents';
import { scheduler } from '@/scheduler';
import { stopAllAudio, stopVoicesStartingAfter } from '@/audio';
import { AUDIO_LOOKAHEAD_SEC } from '@/constants';

// No Web Audio in jsdom: the scheduler and audio layer are stand-ins
let audioNow = 0;
vi.mock('@/audio', () => ({
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

// Steps a quarter second apart (or `step`), pitches as given
const steps = (n = 4, step = 0.25, pitches?: number[]): PhraseEvent[] =>
  Array.from({ length: n }, (_, index) => ({
    abs: pitches?.[index] ?? index,
    startTimeSec: index * step,
    durSec: step + 0.04,
    index,
  }));

// Four steps starting at audio time 10, a second per pass
const run = (loop = false, events = steps()): PhraseRun => ({ events, base: 10, passDuration: events.length * 0.25, loop });

describe('nextStep', () => {
  it('starts with the first step before the phrase begins', () => {
    expect(nextStep(run(), 9.9)).toEqual({ index: 0, at: 10 });
  });

  it('finds the next step that has not started yet, and when it is due', () => {
    expect(nextStep(run(), 10.3)).toEqual({ index: 2, at: 10.5 });
    // A step exactly at `now` has started
    expect(nextStep(run(), 10.25)).toEqual({ index: 2, at: 10.5 });
  });

  it('runs out after the last step of a single pass', () => {
    expect(nextStep(run(), 10.8)).toBeNull();
  });

  it('wraps into the next pass of a loop', () => {
    expect(nextStep(run(true), 10.8)).toEqual({ index: 0, at: 11 });
    expect(nextStep(run(true), 13.6)).toEqual({ index: 3, at: 13.75 });
  });
});

describe('resumePoint', () => {
  it('carries on from the next step on its beat', () => {
    expect(resumePoint(run(), 10.3, steps(), false)).toEqual({ index: 2, at: 10.5 });
  });

  it('starts over when the phrase is now shorter than where it had got to', () => {
    expect(resumePoint(run(), 10.6, steps(2), false)).toEqual({ index: 0, at: 10.75 });
  });

  it('lets a single pass on its last note finish when nothing more is to come', () => {
    expect(resumePoint(run(), 10.8, steps(), false)).toBeNull();
    expect(resumePoint(run(), 10.8, steps(3), false)).toBeNull();
  });

  it('goes round again on the next beat when Loop comes on during the last note', () => {
    expect(resumePoint(run(), 10.8, steps(), true)).toEqual({ index: 0, at: 11 });
  });

  it('goes on into the new steps on the next beat when the phrase gets longer', () => {
    expect(resumePoint(run(), 10.8, steps(7), false)).toEqual({ index: 4, at: 11 });
  });

  it('does not repeat the tonic a descending pass just ended on', () => {
    // Up and back down; looping drops the closing tonic, which has just sounded
    const once = steps(5, 0.25, [0, 2, 4, 2, 0]);
    const looped = steps(4, 0.25, [0, 2, 4, 2]);
    expect(resumePoint(run(false, once), 11.05, looped, true)).toEqual({ index: 1, at: 11.25 });
  });
});

describe('usePhrasePlayer', () => {
  type Props = Parameters<typeof usePhrasePlayer>[0];
  const STEP = 0.2;
  const start = AUDIO_LOOKAHEAD_SEC;

  beforeEach(() => {
    audioNow = 0;
    vi.clearAllMocks();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const render = (props: Partial<Props> = {}) => {
    const initialProps: Props = { events: steps(4, STEP), loopDuration: 4 * STEP, loop: false, ...props };
    const hook = renderHook((p: Props) => usePhrasePlayer(p), { initialProps });
    act(() => hook.result.current.onTogglePlay());
    return { ...hook, props: initialProps };
  };

  const sessions = () => vi.mocked(scheduler.startPhraseSession).mock.calls;
  const lastSession = () => {
    const [events, , , loopDuration, startIndex] = sessions()[sessions().length - 1];
    return { events, loopDuration, startIndex: startIndex ?? 0 };
  };
  // The last of four steps starts at start + 0.6
  const duringLastNote = () => { audioNow = start + 3 * STEP + 0.05; };
  const toTheEnd = () => act(() => { vi.advanceTimersByTime(5000); });

  it('lets the last notes ring out when a single pass plays to its end', () => {
    const { result } = render();
    expect(result.current.isPlaying).toBe(true);
    expect(stopAllAudio).toHaveBeenCalledTimes(1); // clearing the way at play

    toTheEnd();
    expect(result.current.isPlaying).toBe(false);
    expect(scheduler.stopSession).toHaveBeenCalled();
    // Ending is not stopping: nothing sounding is cut
    expect(stopAllAudio).toHaveBeenCalledTimes(1);
  });

  it('silences what is sounding when stopped', () => {
    const { result } = render();
    act(() => result.current.stop());
    expect(result.current.isPlaying).toBe(false);
    expect(stopAllAudio).toHaveBeenCalledTimes(2);
  });

  it('silences when the phrase becomes empty', () => {
    const { result, rerender, props } = render();
    duringLastNote();
    act(() => rerender({ ...props, events: [] }));
    expect(result.current.isPlaying).toBe(false);
    expect(stopAllAudio).toHaveBeenCalledTimes(2);
  });

  it('keeps going when Loop is turned on during the last note', () => {
    const { result, rerender, props } = render();
    duringLastNote();
    act(() => rerender({ ...props, loop: true }));

    expect(sessions()).toHaveLength(2);
    const { events, loopDuration, startIndex } = lastSession();
    expect(loopDuration).toBeCloseTo(4 * STEP, 9);
    expect(startIndex).toBe(0);
    // On the beat after the last step, where a fifth note would have been
    expect(events[0].startTimeSec).toBeCloseTo(start + 4 * STEP, 9);

    toTheEnd();
    expect(result.current.isPlaying).toBe(true);
  });

  it('plays on into new steps when the phrase gets longer during its last note', () => {
    const { result, rerender, props } = render();
    duringLastNote();
    act(() => rerender({ ...props, events: steps(6, STEP), loopDuration: 6 * STEP }));

    const { events, startIndex } = lastSession();
    expect(startIndex).toBe(4);
    expect(events[4].startTimeSec).toBeCloseTo(start + 4 * STEP, 9);
    expect(result.current.isPlaying).toBe(true);

    toTheEnd();
    expect(result.current.isPlaying).toBe(false);
  });

  it('just finishes when a change during the last note takes it no further', () => {
    const { result, rerender, props } = render();
    duringLastNote();
    act(() => rerender({ ...props, soundType: 'organ' }));
    expect(sessions()).toHaveLength(1);
    expect(stopVoicesStartingAfter).not.toHaveBeenCalled();

    toTheEnd();
    expect(result.current.isPlaying).toBe(false);
    expect(stopAllAudio).toHaveBeenCalledTimes(1);
  });
});
