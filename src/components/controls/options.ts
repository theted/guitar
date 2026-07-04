import { SCALE_GROUPS, TUNING_GROUPS, KEYS } from "@/constants";
import { parseKey, formatNote } from "@/theory/spelling";
import type { DarkSelectGroup } from "@/components/ui/dark-select";

// Option lists shared between the top bar and the settings drawer.
export const SCALE_GROUP_OPTIONS: DarkSelectGroup[] = SCALE_GROUPS.map((group) => ({
  label: group.label,
  options: group.scales.map((scale) => ({ value: scale.value, label: scale.label })),
}));

export const TUNING_GROUP_OPTIONS: DarkSelectGroup[] = TUNING_GROUPS.map((group) => ({
  label: group.label,
  options: group.tunings.map((tuning) => ({ value: tuning, label: tuning })),
}));

export const KEY_OPTIONS = KEYS.map((k) => ({ value: k, label: formatNote(parseKey(k)) }));
