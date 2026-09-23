import React from "react";
import { Minus, Plus } from "lucide-react";

type StepperProps = {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  "aria-label": string;
  /** Formats the readout, e.g. "24 frets" */
  format?: (value: number) => string;
};

// − value + : for small integer ranges where typing a number is overkill.
export const Stepper: React.FC<StepperProps> = ({ value, onChange, min, max, format, "aria-label": ariaLabel }) => {
  const set = (next: number) => onChange(Math.min(max, Math.max(min, next)));
  const btn =
    "grid h-8 w-8 place-items-center rounded-md text-ink-2 transition-colors hover:bg-raised hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <div
      role="spinbutton"
      aria-label={ariaLabel}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={format?.(value)}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowUp" || event.key === "ArrowRight") { event.preventDefault(); set(value + 1); }
        if (event.key === "ArrowDown" || event.key === "ArrowLeft") { event.preventDefault(); set(value - 1); }
      }}
      className="inline-flex items-center rounded-lg bg-surface p-0.5 ring-1 ring-inset ring-line"
    >
      <button type="button" tabIndex={-1} className={btn} onClick={() => set(value - 1)} disabled={value <= min} aria-label={`Fewer ${ariaLabel.toLowerCase()}`}>
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="tabular min-w-[4.5rem] text-center text-sm font-medium text-ink">{format ? format(value) : value}</span>
      <button type="button" tabIndex={-1} className={btn} onClick={() => set(value + 1)} disabled={value >= max} aria-label={`More ${ariaLabel.toLowerCase()}`}>
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
