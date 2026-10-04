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

  it('opens a shared link, then follows changes in the address bar', () => {
    setFormState({ tone: 'e', scale: 'blues' });
    window.history.replaceState(null, '', '#key=a&scale=dorian');
    renderHook(() => useShareableUrl());
    expect(useFormStore.getState().tone).toBe('a');
    expect(useFormStore.getState().scale).toBe('dorian');

    setFormState({ tone: 'g' });
    expect(window.location.hash).toContain('key=g');
    expect(window.location.hash).toContain('scale=dorian');
  });
});
