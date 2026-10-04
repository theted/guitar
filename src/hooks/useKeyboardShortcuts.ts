import { useEffect } from "react";
import { setFormState, useFormStore } from "@/store";
import { TEMPO, clampTempo } from "@/constants";
import { KEYS_CHROMATIC } from "@/components/controls/options";

type UseKeyboardShortcutsArgs = {
  togglePlay: () => void;
  stop: () => void;
  /** Suppress the global Escape-to-stop while a dialog handles Escape itself */
  panelOpen: boolean;
};

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

// Both apply while playing, like the controls they stand in for
const adjustBpm = (delta: number) => {
  const { bpm } = useFormStore.getState();
  setFormState({ bpm: clampTempo(bpm + delta) });
};

const stepKey = (delta: number) => {
  const index = KEYS_CHROMATIC.indexOf(useFormStore.getState().tone);
  const next = (index + delta + KEYS_CHROMATIC.length) % KEYS_CHROMATIC.length;
  setFormState({ tone: KEYS_CHROMATIC[next] });
};

// Global shortcuts: Space = play/pause, Escape = stop, ↑/↓ = tempo, ←/→ = key.
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
        adjustBpm(TEMPO.STEP);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        adjustBpm(-TEMPO.STEP);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        stepKey(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepKey(-1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [togglePlay, stop, panelOpen]);
};
