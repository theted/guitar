import { renderHook } from '@testing-library/react';
import { readUrlHash, toUrlHash, useShareableUrl } from './useShareableUrl';
import { setFormState, useFormStore } from '@/store';

describe('shareable URL', () => {
  it('round-trips the exercise through the hash', () => {
    const state = { tone: 'bb', scale: 'pentatonic major', phraseMode: 'thirds', bpm: 140 } as const;
    expect(readUrlHash(toUrlHash(state))).toEqual(state);
  });

  it('ignores anything it does not recognise', () => {
    expect(readUrlHash('#key=h&scale=nope&pattern=jazz&bpm=fast')).toEqual({});
    expect(readUrlHash('#bpm=5000').bpm).toBe(700);
    expect(readUrlHash('')).toEqual({});
  });

  it('opens a shared link, then keeps the address bar in step', () => {
    vi.useFakeTimers();
    try {
      setFormState({ tone: 'e', scale: 'blues' });
      window.history.replaceState(null, '', '#key=a&scale=dorian');
      renderHook(() => useShareableUrl());
      expect(useFormStore.getState().tone).toBe('a');
      expect(useFormStore.getState().scale).toBe('dorian');

      setFormState({ tone: 'g' });
      vi.advanceTimersByTime(400);
      expect(window.location.hash).toContain('key=g');
      expect(window.location.hash).toContain('scale=dorian');
    } finally {
      vi.useRealTimers();
    }
  });

  it('batches rapid changes into one address-bar write', () => {
    vi.useFakeTimers();
    const replace = vi.spyOn(window.history, 'replaceState');
    try {
      renderHook(() => useShareableUrl());
      replace.mockClear();
      for (let bpm = 100; bpm < 200; bpm += 5) setFormState({ bpm });
      vi.advanceTimersByTime(400);
      expect(replace).toHaveBeenCalledTimes(1);
      expect(window.location.hash).toContain('bpm=195');
    } finally {
      replace.mockRestore();
      vi.useRealTimers();
    }
  });

  it('plays a linked pattern rather than a stored position', () => {
    setFormState({ selectedPosition: 3 });
    window.history.replaceState(null, '', '#key=c&scale=major&pattern=thirds');
    renderHook(() => useShareableUrl());
    expect(useFormStore.getState().selectedPosition).toBeNull();
    expect(useFormStore.getState().phraseMode).toBe('thirds');
  });

  it('follows a link pasted into the address bar without a reload', () => {
    renderHook(() => useShareableUrl());
    window.location.hash = '#key=d&scale=lydian';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(useFormStore.getState().tone).toBe('d');
    expect(useFormStore.getState().scale).toBe('lydian');
  });
});
