import React, { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { getScalePitchClasses } from '@/music';
import { getScaleSpelling, formatNote, parseKey } from '@/theory/spelling';
import { intervalName } from '@/theory/intervals';
import { getDiatonicChords } from '@/theory/chords';
import { scales } from '@/constants';
import { ucFirst } from '@/lib/utils';
import { useFormStore } from '@/store';
import FieldLabel from '@/components/ui/field-label';

// Read-only summary of the current key + scale: spelled notes, interval
// formula and the diatonic chords (when the scale supports them).
const ScaleInfo: React.FC = () => {
  const { scale, keyy } = useFormStore(useShallow((state) => ({
    scale: state.scale,
    keyy: state.tone,
  })));

  const pitchClasses = useMemo(() => getScalePitchClasses(scales[scale]), [scale]);
  const spelled = useMemo(() => getScaleSpelling(keyy, pitchClasses), [keyy, pitchClasses]);
  const chords = useMemo(() => getDiatonicChords(keyy, pitchClasses), [keyy, pitchClasses]);

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="text-white/90 font-semibold">
        {formatNote(parseKey(keyy))} {ucFirst(scale)}
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Notes</FieldLabel>
        <div className="flex flex-wrap gap-1.5">
          {spelled.map((note, index) => (
            <span
              key={index}
              className="px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-white/80 text-xs"
            >
              {formatNote(note)}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Intervals</FieldLabel>
        <div className="flex flex-wrap gap-1.5">
          {pitchClasses.map((pc) => (
            <span key={pc} className="px-2 py-0.5 rounded bg-white/[0.04] text-white/60 text-xs font-mono">
              {intervalName(pc)}
            </span>
          ))}
        </div>
      </div>

      {chords.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Diatonic chords</FieldLabel>
          <table className="text-xs text-white/70">
            <tbody>
              {chords.map((chord) => (
                <tr key={chord.degree} className="border-b border-white/[0.04] last:border-0">
                  <td className="py-1 pr-3 font-semibold text-white/50 w-10">{chord.roman}</td>
                  <td className="py-1 pr-3">{chord.name}</td>
                  <td className="py-1 text-white/40">{chord.seventhName ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ScaleInfo;
