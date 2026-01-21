import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
  className = "h-10 text-base",
}) => {
  return (
    <div className="grid gap-1">
      <Label htmlFor={id} className="text-base text-white">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        value={String(value)}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          stopAllPlayback();
          const nextValue = parseInt((event.target as HTMLInputElement).value, 10);
          onChange(Number.isNaN(nextValue) ? 0 : nextValue);
        }}
        className={className}
      />
    </div>
  );
};

export default FormNumber;
