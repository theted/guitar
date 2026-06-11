import { useEffect } from "react";
import { setFormState, useFormStore } from "@/store";

type UseKeyboardShortcutsArgs = {
  togglePlay: () => void;
  stop: () => void;
  /** Suppress the global Escape-to-stop while a dialog handles Escape itself */
  panelOpen: boolean;
};

const BPM_STEP = 5;
const BPM_MIN = 30;
const BPM_MAX = 700;

// Interactive elements handle their own key events (Space activates buttons,
// arrows move sliders); the global shortcuts must not double-fire on them.
const targetHandlesKeys = (target: EventTarget | null): boolean => {
  const element = target as HTMLElement | null;
  if (!element || !element.tagName) return false;
  const tag = element.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON") return true;
  if (element.isContentEditable) return true;
  return element.closest('[role="combobox"], [role="listbox"], [role="dialog"]') != null;
};

const adjustBpm = (delta: number) => {
  const { bpm } = useFormStore.getState();
  setFormState({ bpm: Math.min(BPM_MAX, Math.max(BPM_MIN, bpm + delta)) });
};

// Global shortcuts: Space = play/pause, Escape = stop, arrows = BPM.
export const useKeyboardShortcuts = ({ togglePlay, stop, panelOpen }: UseKeyboardShortcutsArgs) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (targetHandlesKeys(event.target)) return;

      if (event.code === "Space") {
        event.preventDefault();
        togglePlay();
      } else if (event.key === "Escape" && !panelOpen) {
        stop();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        adjustBpm(BPM_STEP);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        adjustBpm(-BPM_STEP);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [togglePlay, stop, panelOpen]);
};
