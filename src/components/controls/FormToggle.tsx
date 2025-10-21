import React from "react";
import { Label } from "@/components/ui/label";

type FormToggleProps = {
  id: string;
  label: string;
  checked: boolean;
  stopAllPlayback: () => void;
  onChange: (checked: boolean) => void;
};

const FormToggle: React.FC<FormToggleProps> = ({
  id,
  label,
  checked,
  stopAllPlayback,
  onChange,
}) => {
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => {
          stopAllPlayback();
          const target = event.target as HTMLInputElement;
          onChange(target.checked);
        }}
        className="h-4 w-4"
      />
      <Label htmlFor={id} className="text-base text-white">
        {label}
      </Label>
    </div>
  );
};

export default FormToggle;
