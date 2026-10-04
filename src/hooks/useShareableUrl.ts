import { useEffect } from "react";
import { setFormState, useFormStore, type FormState } from "@/store";
import { KEYS, PHRASE_MODE_GROUPS, scales, clampTempo, type KeyName, type PhraseMode, type ScaleName } from "@/constants";

// The part of the setup worth sharing: what to practise, not how the neck is
// drawn. Kept in the URL hash so a copied link opens the same exercise.
type Shared = Pick<FormState, "tone" | "scale" | "phraseMode" | "bpm">;

const PATTERNS = new Set<string>(PHRASE_MODE_GROUPS.flatMap((group) => group.modes.map((mode) => mode.value)));

export const toUrlHash = (state: Shared): string => {
  const params = new URLSearchParams({
    key: state.tone,
    scale: state.scale,
    pattern: state.phraseMode,
    bpm: String(state.bpm),
  });
  return `#${params.toString()}`;
};

/** Settings from a URL hash; anything unrecognised is left out */
export const readUrlHash = (hash: string): Partial<Shared> => {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const shared: Partial<Shared> = {};
  const key = params.get("key");
  if (key && (KEYS as readonly string[]).includes(key)) shared.tone = key as KeyName;
  const scale = params.get("scale");
  if (scale && scale in scales) shared.scale = scale as ScaleName;
  const pattern = params.get("pattern");
  if (pattern && PATTERNS.has(pattern)) shared.phraseMode = pattern as PhraseMode;
  const bpm = Number(params.get("bpm"));
  if (params.has("bpm") && Number.isFinite(bpm)) shared.bpm = clampTempo(Math.round(bpm));
  return shared;
};

/** Address-bar writes are batched: browsers rate-limit replaceState */
const WRITE_DELAY_MS = 300;

/** Open the exercise a link describes, then keep the address bar in step */
export const useShareableUrl = () => {
  useEffect(() => {
    const open = () => {
      const fromUrl = readUrlHash(window.location.hash);
      if (Object.keys(fromUrl).length === 0) return;
      // A link to a pattern plays that pattern, not a position practised here before
      setFormState(fromUrl.phraseMode ? { ...fromUrl, selectedPosition: null } : fromUrl);
    };
    open();

    // replaceState never fires hashchange, so this is only ever a link pasted
    // into the address bar, or Back/Forward — the page doesn't reload for those
    window.addEventListener("hashchange", open);

    // Dragging the tempo or holding ↑ changes state many times a second;
    // Safari throws past 100 replaceState calls in 10 s
    let timer: number | null = null;
    const flush = () => {
      timer = null;
      const hash = toUrlHash(useFormStore.getState());
      if (window.location.hash !== hash) window.history.replaceState(null, "", hash);
    };
    flush();
    const unsubscribe = useFormStore.subscribe(() => {
      if (timer === null) timer = window.setTimeout(flush, WRITE_DELAY_MS);
    });
    return () => {
      window.removeEventListener("hashchange", open);
      unsubscribe();
      if (timer !== null) window.clearTimeout(timer);
    };
  }, []);
};
