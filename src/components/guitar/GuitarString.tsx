import React, { useState, useCallback } from "react";
import cx from "classnames";
import { getNoteWithOctave } from "@/music";
import { SoundType, ensureAudioInitialized } from "@/audio";
import { scheduler } from "@/scheduler";
import Field from "@/components/common/Field";
import { scales as baseScales, type ScaleName } from "@/constants";
import { toneAnimationManager } from "@/lib/tone-animation";
import { useStringNotes, type FretDescriptor } from "./hooks/useStringNotes";

type ScaleDefinition = typeof baseScales;

const OffsetField: React.FC<{ value: number; onChange: (value: number) => void }> = ({ value, onChange }) => (
  <Field
    onChange={(next) => onChange(parseInt(next, 10) || 0)}
    value={String(value)}
    type="number"
    className="absolute left-2 top-1 w-16 text-xs opacity-0 hover:opacity-100"
  />
);

type UseFretClickArgs = {
  soundType: SoundType;
  onPlayNote?: (absSemitone: number, durationMs?: number, source?: 'fretboard' | 'phrase') => void;
};

const useFretClick = ({ soundType, onPlayNote }: UseFretClickArgs) => {
  return useCallback(
    async (note: number) => {
      try {
        await ensureAudioInitialized();
        scheduler.triggerNow(note, 300, soundType, (abs, durMs) => onPlayNote?.(abs, durMs, 'fretboard'));
      } catch (error) {
        console.error('Failed to play note:', error);
      }
    },
    [soundType, onPlayNote]
  );
};

type StringFretProps = {
  descriptor: FretDescriptor;
  onClick: (note: number) => void;
  reduceAnimations: boolean;
  minimalHighlight: boolean;
};

const StringFret: React.FC<StringFretProps> = ({ descriptor, onClick, reduceAnimations, minimalHighlight }) => {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    toneAnimationManager.applyToneClass(element, descriptor.actualNote);
    return () => { toneAnimationManager.clearToneClass(element); };
  }, [descriptor.actualNote]);

  const colorClasses = descriptor.isBase && descriptor.showScaleHighlight
    ? "bg-black/70 text-white border-white/20"
    : descriptor.showScaleHighlight
    ? "bg-zinc-700/60 text-white border-white/10"
    : "bg-zinc-800/40 text-zinc-100 border-white/10";

  return (
    <div
      ref={ref}
      data-abs={descriptor.actualNote}
      className={cx(
        "relative flex items-center justify-center text-sm md:text-base h-16 md:h-20 rounded-md border transition-transform transition-colors duration-75 cursor-pointer select-none",
        colorClasses,
        "fret-button",
        reduceAnimations ? "" : "hover:bg-white/20 transition-transform duration-75 hover:scale-[1.03]"
      )}
      onClick={() => onClick(descriptor.actualNote)}
    >
      {getNoteWithOctave(descriptor.actualNote)}
      {descriptor.showScaleHighlight && descriptor.degree && !minimalHighlight && (
        <span
          className={cx(
            "absolute top-1 right-1 text-[11px] px-1 py-0.5 rounded",
            descriptor.isBase ? "bg-emerald-500/30" : "bg-amber-500/30"
          )}
        >
          {descriptor.degree}
        </span>
      )}
      {/* Tone-based animation overlay — primary highlighting system */}
      <span className="tone-overlay" />
    </div>
  );
};

type Props = {
  idx: number;
  note: number;
  frets: number;
  scales?: ScaleDefinition;
  scale: ScaleName;
  keyy: string;
  scaleHighlightBottomOnly?: boolean;
  isBottom?: boolean;
  reduceAnimations?: boolean;
  trailLength?: number;
  minimalHighlight?: boolean;
  soundType?: SoundType;
  onPlayNote?: (absSemitone: number, durationMs?: number, source?: 'fretboard' | 'phrase') => void;
}

const GuitarString: React.FC<Props> = React.memo(({
  idx: _idx,
  note,
  frets,
  scales = baseScales,
  scale,
  keyy,
  scaleHighlightBottomOnly = false,
  isBottom = false,
  reduceAnimations = false,
  minimalHighlight = false,
  soundType = "marimba",
  onPlayNote,
}) => {
  const [offset, setOffset] = useState<number>(0);

  const fretDescriptors = useStringNotes({
    note,
    frets,
    offset,
    scale,
    keyy,
    scaleMap: scales,
    scaleHighlightBottomOnly,
    isBottom,
  });

  const handleFretClick = useFretClick({ soundType, onPlayNote });

  return (
    <div className="relative grid grid-cols-[repeat(auto-fit,minmax(48px,1fr))] gap-1 guitar-string">
      <OffsetField value={offset} onChange={setOffset} />
      {fretDescriptors.map((descriptor) => (
        <StringFret
          key={descriptor.fret}
          descriptor={descriptor}
          onClick={handleFretClick}
          reduceAnimations={reduceAnimations}
          minimalHighlight={minimalHighlight}
        />
      ))}
    </div>
  );
});

export default GuitarString;
