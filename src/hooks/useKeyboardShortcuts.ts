import { useEffect } from "react";
import { setFormState, useFormStore } from "@/store";
import { TEMPO, clampTempo } from "@/constants";
import { KEYS_CHROMATIC } from "@/components/controls/options";

type UseKeyboardShortcutsArgs = {
  togglePlay: () => void;
  stop: () => void;
  /** Suppress the global shortcuts while the settings dialog is open */
  panelOpen: boolean;
};

const TEXT_INPUT_TYPES = new Set(["text", "search", "number", "email", "url", "tel", "password"]);

/** Typing somewhere: no single-key shortcut may fire */
const isTextEntry = (element: HTMLElement): boolean => {
  if (element.isContentEditable || element.tagName === "TEXTAREA" || element.tagName === "SELECT") return true;
  return element instanceof HTMLInputElement && TEXT_INPUT_TYPES.has(element.type);
};

/**
 * Was this control focused from the keyboard? A mouse click also focuses a
 * button, but that's incidental: Space should still mean play, not "press the
 * last thing I clicked". Keyboard users keep the native behaviour.
 */
const focusedByKeyboard = (element: HTMLElement): boolean => {
  try {
    return element.matches(":focus-visible");
  } catch {
    return true; // no :focus-visible support: assume native behaviour wins
  }
};

/** Controls that use the arrow keys themselves */
const ARROW_OWNERS = '[role="radio"], [role="slider"], [role="spinbutton"], [role="listbox"], [role="option"], [role="combobox"], input[type="range"]';
/** Controls that act on Space themselves */
const SPACE_OWNERS = 'button, [role="button"], [role="radio"], [role="switch"], [role="combobox"], [role="option"], a[href]';

const targetOf = (event: KeyboardEvent): HTMLElement | null => {
  const target = event.target as HTMLElement | null;
  return target && target.tagName ? target : null;
};

// Both apply while playing, like the controls they stand in for
const adjustBpm = (delta: number) => {
  const { bpm } = useFormStore.getState();
  setFormState({ bpm: clampTempo(bpm + delta) });
};

export const stepKey = (delta: number) => {
  const index = KEYS_CHROMATIC.indexOf(useFormStore.getState().tone);
  const next = (index + delta + KEYS_CHROMATIC.length) % KEYS_CHROMATIC.length;
  setFormState({ tone: KEYS_CHROMATIC[next] });
};

// Global shortcuts: Space = play/pause, Escape = stop, ↑/↓ = tempo, ←/→ = key.
// Listened for in the capture phase so Space can still mean play/pause on a
// control that was merely clicked, before that control acts on it.
export const useKeyboardShortcuts = ({ togglePlay, stop, panelOpen }: UseKeyboardShortcutsArgs) => {
  useEffect(() => {
    // The Space that started a play toggle must not also click the focused button on keyup
    let swallowSpaceKeyUp = false;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (panelOpen) return;
      const target = targetOf(event);
      if (target) {
        if (isTextEntry(target)) return;
        // An open picker or a dialog handles its own keys
        if (target.closest('[role="listbox"], [role="dialog"]')) return;
      }

      if (event.code === "Space") {
        if (target?.closest(SPACE_OWNERS) && focusedByKeyboard(target)) return;
        event.preventDefault();
        event.stopPropagation();
        swallowSpaceKeyUp = true;
        if (!event.repeat) togglePlay();
        return;
      }

      if (event.key === "Escape") {
        stop();
        return;
      }

      const arrow = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" }[event.key];
      if (!arrow) return;
      if (target?.closest(ARROW_OWNERS) && focusedByKeyboard(target)) return;
      event.preventDefault();
      event.stopPropagation();
      if (arrow === "up") adjustBpm(TEMPO.STEP);
      else if (arrow === "down") adjustBpm(-TEMPO.STEP);
      else stepKey(arrow === "right" ? 1 : -1);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space" || !swallowSpaceKeyUp) return;
      swallowSpaceKeyUp = false;
      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
    };
  }, [togglePlay, stop, panelOpen]);
};
