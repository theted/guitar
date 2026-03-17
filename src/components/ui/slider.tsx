import React from 'react';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
  id?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  className = '',
  id,
}) => {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className={`relative flex items-center h-5 ${className}`}>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-[3px] rounded-full appearance-none cursor-pointer
          focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
          [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-100
          [&::-webkit-slider-thumb]:hover:scale-125
          [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3
          [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white
          [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
        style={{
          background: `linear-gradient(to right, #22d3ee 0%, #22d3ee ${pct}%, rgba(255,255,255,0.12) ${pct}%, rgba(255,255,255,0.12) 100%)`,
        }}
      />
    </div>
  );
};
