import React from 'react';
import cx from 'classnames';
import { Music } from 'lucide-react';
import { setFormState } from '@/store';
import { useRiffs } from './hooks/useRiffs';
import Eyebrow from '@/components/ui/eyebrow';

// Demo riffs for the current scale. Selecting one makes Play perform that
// line (with the usual fretboard highlighting) instead of the phrase pattern;
// only rendered for scales that have authored riffs.
const RiffStrip: React.FC = () => {
  const { riffs, activeRiff } = useRiffs();

  if (riffs.length === 0) return null;

  return (
    <div className="mb-3 flex items-start gap-2">
      <Eyebrow>Riffs</Eyebrow>
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Demo riffs">
        {riffs.map((riff) => {
          const active = activeRiff?.id === riff.id;
          return (
            <button
              key={riff.id}
              type="button"
              aria-pressed={active}
              onClick={() =>
                setFormState({
                  selectedRiffId: active ? null : riff.id,
                  selectedPosition: null,
                })
              }
              title={`${riff.name} — a short line that shows off this scale. Select it, then press Play.`}
              className={cx(
                'inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs transition-colors select-none',
                active
                  ? 'bg-white/20 text-white border-white/60'
                  : 'bg-white/[0.04] text-white/60 border-white/[0.08] hover:bg-white/[0.08] hover:text-white/80'
              )}
            >
              <Music className={cx('w-3 h-3', active ? 'text-white/80' : 'text-white/30')} />
              <span className="font-semibold">{riff.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RiffStrip;
