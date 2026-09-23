import React from 'react';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
  id?: string;
  'aria-label'?: string;
  'aria-valuetext'?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  className = '',
  id,
  'aria-label': ariaLabel,
  'aria-valuetext': valueText,
}) => {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={ariaLabel}
      aria-valuetext={valueText}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`range ${className}`}
      style={{ '--pct': `${pct}%` } as React.CSSProperties}
    />
  );
};
