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
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-medium text-ink-3">Positions</span>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Scale positions">
        {positions.map((position) => {
          const active = selectedPosition === position.index;
          return (
            <button
              key={position.index}
              type="button"
              aria-pressed={active}
              onClick={() => setFormState({ selectedPosition: active ? null : position.index })}
              title={`Frets ${position.lowFret}–${position.highFret}. Play steps through this box one note at a time.`}
              className={cx(
                'inline-flex h-8 items-baseline gap-1.5 rounded-lg px-2.5 text-sm transition-colors select-none',
                active
                  ? 'bg-ink text-bg'
                  : 'text-ink ring-1 ring-inset ring-line hover:bg-surface'
              )}
            >
              <span className="font-semibold">{position.index}</span>
              <span className={cx('tabular text-xs', active ? 'text-bg/70' : 'text-ink-3')}>
                {position.lowFret}–{position.highFret}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PositionStrip;
