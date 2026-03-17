import React from 'react';

type FormNumberProps = {
  id: string;
  label: string;
  value: number;
  stopAllPlayback: () => void;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
};

const FormNumber: React.FC<FormNumberProps> = ({
  id,
  label,
  value,
  stopAllPlayback,
  onChange,
  min,
  max,
  step,
}) => {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[11px] font-medium uppercase tracking-wider text-white/40">
        {label}
      </label>
      <input
        id={id}
        type="number"
        value={String(value)}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          stopAllPlayback();
          const next = parseInt(e.target.value, 10);
          onChange(Number.isNaN(next) ? 0 : next);
        }}
        className="h-8 w-full rounded-md border border-white/[0.08] bg-white/[0.05] px-2.5 text-sm text-white/80
          focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.07] transition-colors
          [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  );
};

export default FormNumber;
