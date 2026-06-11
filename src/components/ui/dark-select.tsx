import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./select";

export type DarkSelectOption = { value: string; label: string };
export type DarkSelectGroup = { label?: string; options: DarkSelectOption[] };

type DarkSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  /** Flat list of options; use `groups` instead for sectioned content */
  options?: DarkSelectOption[];
  groups?: DarkSelectGroup[];
  "aria-label"?: string;
};

const TRIGGER_CLS =
  "h-8 border-white/[0.08] bg-white/[0.05] text-white/80 text-xs focus:ring-cyan-500/50 hover:bg-white/[0.08] transition-colors";
const CONTENT_CLS = "bg-[#0f0f1a] border border-white/[0.08] text-white/80";
const ITEM_CLS = "text-xs focus:bg-white/[0.08] focus:text-white";
const GROUP_LABEL_CLS = "text-[10px] uppercase tracking-wider text-white/30";

// Dark-themed select used across all control panels.
export const DarkSelect: React.FC<DarkSelectProps> = ({
  value,
  onValueChange,
  options,
  groups,
  "aria-label": ariaLabel,
}) => (
  <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger className={TRIGGER_CLS} aria-label={ariaLabel}>
      <SelectValue />
    </SelectTrigger>
    <SelectContent className={CONTENT_CLS}>
      {options?.map((option) => (
        <SelectItem key={option.value} value={option.value} className={ITEM_CLS}>
          {option.label}
        </SelectItem>
      ))}
      {groups?.map((group, index) => (
        <SelectGroup key={group.label ?? index}>
          {group.label && <SelectLabel className={GROUP_LABEL_CLS}>{group.label}</SelectLabel>}
          {group.options.map((option) => (
            <SelectItem key={option.value} value={option.value} className={ITEM_CLS}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      ))}
    </SelectContent>
  </Select>
);
