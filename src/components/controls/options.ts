import { scales, KEYS } from "@/constants";
import { parseKey, formatNote } from "@/theory/spelling";
import { ucFirst } from "@/lib/utils";

// Option lists shared between the top bar and the settings drawer.
export const SCALE_OPTIONS = Object.keys(scales).map((s) => ({ value: s, label: ucFirst(s) }));
export const KEY_OPTIONS = KEYS.map((k) => ({ value: k, label: formatNote(parseKey(k)) }));
