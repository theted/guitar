import React from 'react';
import { Check, Link2, SlidersHorizontal } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { Picker } from '@/components/ui/select';
import ScaleLegend from '@/components/guitar/ScaleLegend';
import { SCALE_GROUP_OPTIONS, KEYS_CHROMATIC, keyLabel } from '@/components/controls/options';
import { setFormState, useFormStore } from '@/store';
import { cn } from '@/lib/utils';
import type { ScaleName } from '@/constants';

type HeaderProps = {
  onOpenSettings: () => void;
};

// Everything about *what* is on the neck: the key, the scale, and the notes
// that make it up. The title is the scale picker itself.
const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const { scale, tone, tuningName, strings } = useFormStore(useShallow((state) => ({
    scale: state.scale,
    tone: state.tone,
    tuningName: state.tuningName,
    strings: state.strings,
  })));


  // The address bar always describes the current exercise (useShareableUrl)
  const [copied, setCopied] = React.useState(false);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable: the address bar still has the link */ }
  };

  return (
    <header className="flex flex-col gap-4 pt-3">
      <div className="flex items-center justify-between gap-4">
        <span className="type-wide text-sm font-semibold tracking-tight text-ink">
          Guitar Scale Finder
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex h-8 items-center gap-2 rounded-lg px-2.5 text-sm text-ink-2 transition-colors hover:bg-surface hover:text-ink"
            aria-label={copied ? 'Link copied' : 'Copy a link to this exercise'}
            title="Copy a link to this key, scale, pattern and tempo"
          >
            {copied ? <Check className="h-4 w-4" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}
            <span className="hidden sm:inline" aria-live="polite">{copied ? 'Link copied' : 'Copy link'}</span>
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex h-8 items-center gap-2 rounded-lg px-2.5 text-sm text-ink-2 transition-colors hover:bg-surface hover:text-ink"
            aria-label="Instrument and display settings"
          >
            <span className="hidden sm:inline">
              {tuningName} tuning, {strings} strings
            </span>
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div
        role="radiogroup"
        aria-label="Key"
        className="quiet-scroll -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0"
      >
        {KEYS_CHROMATIC.map((key) => {
          const active = key === tone;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => { if (!active) setFormState({ tone: key }); }}
              className={cn(
                'h-9 min-w-10 shrink-0 rounded-lg px-2 text-sm font-semibold transition-colors',
                active
                  ? 'bg-ink text-bg'
                  : 'text-ink-2 ring-1 ring-inset ring-line hover:bg-surface hover:text-ink'
              )}
            >
              {keyLabel(key)}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <h1 className="type-title flex min-w-0 items-baseline gap-[0.28em] text-[clamp(2rem,4.6vw,3.4rem)]">
          <span>{keyLabel(tone)}</span>
          <Picker
            variant="title"
            value={scale}
            onValueChange={(v) => setFormState({ scale: v as ScaleName })}
            groups={SCALE_GROUP_OPTIONS}
            aria-label="Scale"
            title="Change scale"
          />
        </h1>
        <ScaleLegend />
      </div>
    </header>
  );
};

export default Header;
