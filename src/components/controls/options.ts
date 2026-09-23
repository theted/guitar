import { SCALE_GROUPS, TUNING_GROUPS, PHRASE_MODE_GROUPS, KEYS, type KeyName } from "@/constants";
import type { SoundType } from "@/audio";
import { keyToOffset } from "@/music";
import { mod12 } from "@/theory/pitch";
import { parseKey, formatNote } from "@/theory/spelling";
import { pretty } from "@/lib/notation";
import type { PickerGroup } from "@/components/ui/select";

// Option lists shared between the header, the transport and the setup drawer.
export const SCALE_GROUP_OPTIONS: PickerGroup[] = SCALE_GROUPS.map((group) => ({
  label: group.label,
  options: group.scales.map((scale) => ({ value: scale.value, label: scale.label })),
}));

export const TUNING_GROUP_OPTIONS: PickerGroup[] = TUNING_GROUPS.map((group) => ({
  label: group.label,
  options: group.tunings.map((tuning) => ({ value: tuning, label: tuning })),
}));

export const keyLabel = (key: KeyName): string => pretty(formatNote(parseKey(key)));

// Keys in chromatic order from C, the way they sit along a string
const C_OFFSET = keyToOffset("c");
export const KEYS_CHROMATIC: KeyName[] = [...KEYS].sort(
  (a, b) => mod12(keyToOffset(a) - C_OFFSET) - mod12(keyToOffset(b) - C_OFFSET)
);

export const SOUND_GROUPS: Array<{ label: string; options: Array<{ value: SoundType; label: string }> }> = [
  {
    label: 'Guitar & bass',
    options: [
      { value: 'guitar-clean', label: 'Clean guitar' },
      { value: 'guitar-distorted', label: 'Distorted guitar' },
      { value: 'bass', label: 'Bass' },
    ],
  },
  {
    label: 'Keys & percussion',
    options: [
      { value: 'marimba', label: 'Marimba' },
      { value: 'piano', label: 'Piano' },
      { value: 'organ', label: 'Organ' },
      { value: 'bells', label: 'Bells' },
    ],
  },
  {
    label: 'Orchestral',
    options: [
      { value: 'strings', label: 'Strings' },
      { value: 'flute', label: 'Flute' },
      { value: 'brass', label: 'Brass' },
    ],
  },
  {
    label: 'Synth',
    options: [
      { value: 'sine', label: 'Sine' },
      { value: 'square', label: 'Square' },
      { value: 'saw', label: 'Saw' },
      { value: 'synth-lead', label: 'Synth lead' },
      { value: 'synth-pad', label: 'Synth pad' },
    ],
  },
];

export const PATTERN_GROUPS: PickerGroup[] = PHRASE_MODE_GROUPS.map((group) => ({
  label: group.label,
  options: group.modes.map((mode) => ({ value: mode.value, label: mode.label })),
}));
