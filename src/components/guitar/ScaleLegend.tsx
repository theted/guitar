import React, { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { keyToOffset, getScalePitchClasses } from '@/music';
import { getScaleSpelling, formatNote } from '@/theory/spelling';
import { scales } from '@/constants';
import { useFormStore } from '@/store';
import ScaleDegree from './ScaleDegree';

// Pure display of the scale's degrees; playback lives in usePlayback/TopBar.
const ScaleLegend: React.FC = () => {
  const { scale, keyy, reduceAnimations, minimalHighlight, trailLength } = useFormStore(
    useShallow((state) => ({
      scale: state.scale,
      keyy: state.tone,
      reduceAnimations: state.reduceAnimations,
      minimalHighlight: state.minimalHighlight,
      trailLength: state.trailLength,
    }))
  );

  const keyOffset = useMemo(() => keyToOffset(keyy), [keyy]);
  const pitchClasses = useMemo(() => getScalePitchClasses(scales[scale]), [scale]);
  const degreeLabels = useMemo(
    () => getScaleSpelling(keyy, pitchClasses).map(formatNote),
    [keyy, pitchClasses]
  );

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {pitchClasses.map((pc, index) => (
        <ScaleDegree
          key={pc}
          index={index}
          label={degreeLabels[index]}
          abs={keyOffset + pc}
          isTonic={index === 0}
          isActive={false}
          reduceAnimations={reduceAnimations}
          minimalHighlight={minimalHighlight}
          trailLength={trailLength}
        />
      ))}
    </div>
  );
};

export default ScaleLegend;
