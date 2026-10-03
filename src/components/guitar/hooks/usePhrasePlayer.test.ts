import { nextStep, type PhraseRun } from './usePhrasePlayer';
import type { PhraseEvent } from './usePhraseEvents';

// Four steps a quarter second apart, starting at audio time 10
const steps = (n = 4, step = 0.25): PhraseEvent[] =>
  Array.from({ length: n }, (_, index) => ({ abs: index, startTimeSec: index * step, durSec: 0.3, index }));

const run = (loopDuration: number | null = null): PhraseRun => ({ events: steps(), base: 10, loopDuration });

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
    expect(nextStep(run(1), 10.8)).toEqual({ index: 0, at: 11 });
    expect(nextStep(run(1), 13.6)).toEqual({ index: 3, at: 13.75 });
  });
});
