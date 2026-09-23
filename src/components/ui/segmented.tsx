import React from "react";
import { cn } from "@/lib/utils";

type SegmentedProps<T extends string | number> = {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<{ value: T; label: React.ReactNode; title?: string }>;
  "aria-label": string;
  className?: string;
  size?: "sm" | "md";
};

// A row of mutually exclusive choices, all visible at once. Arrow keys move
// the selection, as in a native radio group.
export const Segmented = <T extends string | number>({
  value,
  onChange,
  options,
  "aria-label": ariaLabel,
  className,
  size = "md",
}: SegmentedProps<T>) => {
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const selected = options.findIndex((option) => option.value === value);

  const onKeyDown = (event: React.KeyboardEvent) => {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1
      : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (Math.max(0, selected) + step + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn("inline-flex rounded-lg bg-surface p-0.5 ring-1 ring-inset ring-line", className)}
    >
      {options.map((option, index) => {
        const active = index === selected;
        return (
          <button
            key={String(option.value)}
            ref={(el) => { refs.current[index] = el; }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active || (selected < 0 && index === 0) ? 0 : -1}
            title={option.title}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex-1 whitespace-nowrap rounded-md font-medium transition-colors",
              size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-sm",
              active ? "bg-ink text-bg shadow-sm" : "text-ink-2 hover:text-ink"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
