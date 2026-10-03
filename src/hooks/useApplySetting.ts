import { createContext, useCallback, useContext } from "react";
import { setFormState, type FormState } from "@/store";

/** The app-wide stop from usePlayback, provided once in App */
export const StopPlaybackContext = createContext<() => void>(() => {});

export const useStopPlayback = () => useContext(StopPlaybackContext);

/**
 * Apply a settings change that invalidates whatever is currently playing —
 * a different scale, key, pattern or tempo would carry on with stale notes
 * otherwise. Playback stops and the play button resets.
 *
 * Settings that apply cleanly mid-phrase (volume, mute, how the neck is
 * drawn) should call `setFormState` directly instead.
 */
export const useApplySetting = () => {
  const stopAllPlayback = useStopPlayback();
  return useCallback(
    (partial: Partial<FormState>) => {
      stopAllPlayback();
      setFormState(partial);
    },
    [stopAllPlayback]
  );
};
