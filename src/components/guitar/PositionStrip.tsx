import React from 'react';
import cx from 'classnames';
import { useShallow } from 'zustand/react/shallow';
import { setFormState, useFormStore } from '@/store';
import { useScalePositions } from './hooks/useScalePositions';

// Scale position (box) selector. Selecting a position dims everything outside
// the box and makes Play step through it one fret at a time.
const PositionStrip: React.FC = () => {
  const { selectedPosition } = useFormStore(useShallow((state) => ({
    selectedPosition: state.selectedPosition,
  })));
  const { positions } = useScalePositions();

  if (positions.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-1.5" role="group" aria-label="Scale positions">
      {positions.map((position) => {
        const active = selectedPosition === position.index;
        return (
          <button
            key={position.index}
            type="button"
            aria-pressed={active}
            onClick={() => setFormState({ selectedPosition: active ? null : position.index })}
            title={`Position ${position.index}: frets ${position.lowFret}–${position.highFret}. Select to practice this box one note at a time.`}
            className={cx(
              'px-2 py-1 rounded-md border text-xs transition-colors select-none',
              active
                ? 'bg-emerald-500/20 text-emerald-100 border-emerald-400/70'
                : 'bg-white/[0.04] text-white/60 border-white/[0.08] hover:bg-white/[0.08] hover:text-white/80'
            )}
          >
            <span className="font-semibold">P{position.index}</span>
            <span className={cx('ml-1.5', active ? 'text-emerald-200/80' : 'text-white/40')}>
              {position.lowFret}fr
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default PositionStrip;
