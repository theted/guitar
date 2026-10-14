import React from "react";
import { cn } from "@/lib/utils";

type SwatchesProps = {
  /** #rrggbb */
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  "aria-label": string;
};

const SELECTED_RING = "shadow-[0_0_0_2px_var(--bg),0_0_0_4px_var(--ink)]";

// Preset colours as a radio group (arrow keys move the selection, as in
// Segmented), then the system colour picker for any other colour.
export const Swatches: React.FC<SwatchesProps> = ({ value, onChange, options, "aria-label": ariaLabel }) => {
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const selected = options.findIndex((option) => option.value.toLowerCase() === value.toLowerCase());
  const custom = selected < 0;

  const onKeyDown = (event: React.KeyboardEvent) => {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1
      : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = custom ? 0 : (selected + step + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div className="flex items-center gap-2.5">
      <div role="radiogroup" aria-label={ariaLabel} onKeyDown={onKeyDown} className="flex items-center gap-2.5">
        {options.map((option, index) => {
          const active = index === selected;
          return (
            <button
              key={option.value}
              ref={(el) => { refs.current[index] = el; }}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={option.label}
              title={option.label}
              tabIndex={active || (custom && index === 0) ? 0 : -1}
              onClick={() => onChange(option.value)}
              className={cn("h-7 w-7 rounded-full ring-1 ring-inset ring-black/15", active && SELECTED_RING)}
              style={{ background: option.value }}
            />
          );
        })}
      </div>
      <label
        title="Any colour"
        className={cn(
          "relative h-7 w-7 cursor-pointer rounded-full ring-1 ring-inset ring-black/15",
          "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)]",
          custom && SELECTED_RING
        )}
        style={{
          background: custom
            ? value
            : "conic-gradient(#ff6b6b, #ffc94a, #8ee04a, #38bdf8, #a78bfa, #f472b6, #ff6b6b)",
        }}
      >
        <span className="sr-only">Any colour</span>
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
};
