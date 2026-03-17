import { getAudioContext } from "./context";
import { synthesizeSound, semitoneToFrequency } from "./synthesis";
import { SOUND_PRESETS } from "./presets";
import type { SoundType } from "./presets";

export type { SoundType };
export { getAudioContext, ensureAudioInitialized, getCurrentTime, stopAllAudio } from "./context";

export const playSemitoneAt = (
  semitoneFromE0: number,
  startAtTime: number,
  opts?: { duration?: number; type?: SoundType },
): void => {
  const ctx = getAudioContext();
  const duration = opts?.duration ?? 1.2;
  const soundType = opts?.type ?? "marimba";
  const frequency = semitoneToFrequency(semitoneFromE0);
  const config = SOUND_PRESETS[soundType];

  if (!config) {
    console.warn(`Unknown sound type: ${soundType}, falling back to sine`);
    synthesizeSound(ctx, frequency, startAtTime, duration, SOUND_PRESETS.sine);
    return;
  }

  synthesizeSound(ctx, frequency, startAtTime, duration, config);
};

export const playSemitone = (
  semitoneFromE0: number,
  opts?: { duration?: number; type?: SoundType },
): void => {
  const ctx = getAudioContext();
  playSemitoneAt(semitoneFromE0, ctx.currentTime, opts);
};
