import { getAudioContext } from "./context";
import { synthesizeSound, semitoneToFrequency } from "./synthesis";
import { SOUND_PRESETS } from "./presets";
import type { SoundType } from "./presets";

export type { SoundType };
export {
  getAudioContext,
  ensureAudioInitialized,
  getCurrentTime,
  stopAllAudio,
  setMasterVolume,
  getMasterVolume,
} from "./context";

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
    synthesizeSound(ctx, semitoneFromE0, frequency, startAtTime, duration, SOUND_PRESETS.sine);
    return;
  }

  synthesizeSound(ctx, semitoneFromE0, frequency, startAtTime, duration, config);
};
