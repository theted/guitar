import React from "react";
import { cn } from "@/lib/utils";

type SwitchRowProps = {
  id: string;
  label: string;
  /** One line under the label saying what the switch does */
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export const SwitchRow: React.FC<SwitchRowProps> = ({ id, label, hint, checked, onChange }) => (
  <div className="flex items-start justify-between gap-4 py-2">
    <label htmlFor={id} className="cursor-pointer select-none">
      <span className="block text-sm text-ink">{label}</span>
      {hint && <span className="mt-0.5 block text-xs leading-snug text-ink-3">{hint}</span>}
    </label>
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-ink" : "bg-line"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 rounded-full bg-bg shadow transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        )}
      />
    </button>
  </div>
);
