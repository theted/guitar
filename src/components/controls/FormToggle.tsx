import React from 'react';

type FormToggleProps = {
  id: string;
  label: string;
  checked: boolean;
  stopAllPlayback: () => void;
  onChange: (checked: boolean) => void;
};

const FormToggle: React.FC<FormToggleProps> = ({ id, label, checked, stopAllPlayback, onChange }) => {
  return (
    <div className="flex items-center justify-between py-0.5">
      <label htmlFor={id} className="text-xs text-white/60 cursor-pointer select-none leading-none">
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => {
          stopAllPlayback();
          onChange(!checked);
        }}
        className={`relative inline-flex h-[18px] w-8 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 ${
          checked ? 'bg-cyan-500' : 'bg-white/15'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-[17px]' : 'translate-x-[3px]'
          }`}
        />
      </button>
    </div>
  );
};

export default FormToggle;
