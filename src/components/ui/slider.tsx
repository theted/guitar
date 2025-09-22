import React from "react";

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
  className = "",
  id,
}) => {
  return (
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer slider ${className}`}
      style={{
        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value - min) / (max - min)) * 100}%, #d1d5db ${((value - min) / (max - min)) * 100}%, #d1d5db 100%)`,
      }}
    />
  );
};