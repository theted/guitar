import React, { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { keyToOffset, getScalePitchClasses } from '@/music';
import { getScaleSpelling, formatNote } from '@/theory/spelling';
import { intervalName } from '@/theory/intervals';
import { pretty } from '@/lib/notation';
import { scales } from '@/constants';
import { useFormStore } from '@/store';
import ScaleDegree from './ScaleDegree';

// The scale's notes with their intervals; each lights up as it sounds.
const ScaleLegend: React.FC = () => {
  const { scale, keyy } = useFormStore(
    useShallow((state) => ({
      scale: state.scale,
      keyy: state.tone,
    }))
  );

  const keyOffset = useMemo(() => keyToOffset(keyy), [keyy]);
  const pitchClasses = useMemo(() => getScalePitchClasses(scales[scale]), [scale]);
  const degreeLabels = useMemo(
    () => getScaleSpelling(keyy, pitchClasses).map((note) => pretty(formatNote(note))),
    [keyy, pitchClasses]
  );

  return (
    <ol className="flex flex-wrap gap-0.5" aria-label="Notes in the scale">
      {pitchClasses.map((pc, index) => (
        <ScaleDegree
          key={pc}
          label={degreeLabels[index]}
          interval={intervalName(pc)}
          abs={keyOffset + pc}
          isTonic={index === 0}
        />
      ))}
    </ol>
  );
};

export default ScaleLegend;
