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

/** Open the exercise a link describes, then keep the address bar in step */
export const useShareableUrl = () => {
  useEffect(() => {
    const fromUrl = readUrlHash(window.location.hash);
    if (Object.keys(fromUrl).length > 0) setFormState(fromUrl);

    const write = (state: FormState) => {
      const hash = toUrlHash(state);
      if (window.location.hash !== hash) window.history.replaceState(null, "", hash);
    };
    write(useFormStore.getState());
    return useFormStore.subscribe(write);
  }, []);
};
