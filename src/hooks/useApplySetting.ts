import { useCallback } from "react";
import { setFormState, type FormState } from "@/store";

/**
 * Apply a settings change that invalidates whatever is currently playing —
 * a different scale, key or tuning would carry on with stale notes otherwise.
 * Settings that apply cleanly mid-phrase (volume, visual toggles) should call
 * `setFormState` directly instead.
 */
export const useApplySetting = (stopAllPlayback: () => void) =>
  useCallback(
    (partial: Partial<FormState>) => {
      stopAllPlayback();
      setFormState(partial);
    },
    [stopAllPlayback]
  );
