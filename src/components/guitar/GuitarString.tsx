import React, { useState, useCallback } from "react";
import cx from "classnames";
import { getNoteWithOctave } from "@/music";
import { SoundType } from "@/audio";
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
  onPlayNote?: (absSemitone: number, durationMs?: number) => void;
};

const useFretClick = ({ soundType, onPlayNote }: UseFretClickArgs) => {
  return useCallback(
    (note: number) => {
      scheduler.triggerNow(note, 300, soundType, (abs, durMs) => onPlayNote?.(abs, durMs));
    },
    [soundType, onPlayNote]
  );
};

type StringFretProps = {
  descriptor: FretDescriptor;
  onClick: (note: number) => void;
  reduceAnimations: boolean;
  trailLength: number;
  minimalHighlight: boolean;
};

const StringFret: React.FC<StringFretProps> = ({ descriptor, onClick, reduceAnimations, trailLength, minimalHighlight }) => {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    toneAnimationManager.applyToneClass(element, descriptor.actualNote);
  }, [descriptor.actualNote]);

  const baseClasses =
    "relative flex items-center justify-center text-sm md:text-base h-16 md:h-20 rounded-md border transition-transform transition-colors duration-75 cursor-pointer select-none";

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
        baseClasses,
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
      <span className="tone-overlay" />
      {descriptor.isPlayingNote && (
        <span
          className="note-fade-overlay note-fade-strong"
          style={{ animationDuration: `${trailLength}ms` }}
        />
      )}
      {!descriptor.isPlayingNote && descriptor.isPlayingOctave && !reduceAnimations && (
        <span
          className="note-fade-overlay note-fade-weak"
          style={{ animationDuration: `${trailLength}ms` }}
        />
      )}
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
  highlightEnabled?: boolean;
  octaveHighlight?: boolean;
  reduceAnimations?: boolean;
  trailLength?: number;
  minimalHighlight?: boolean;
  soundType?: SoundType;
  playingAbs?: number | null;
  playingSet?: number[];
  onPlayNote?: (absSemitone: number, durationMs?: number) => void;
};

const GuitarString: React.FC<Props> = ({
  idx,
  note,
  frets,
  scales = baseScales,
  scale,
  keyy,
  scaleHighlightBottomOnly = false,
  isBottom = false,
  highlightEnabled = true,
  octaveHighlight = true,
  reduceAnimations = false,
  trailLength = 1200,
  minimalHighlight = false,
  soundType = "marimba",
  playingAbs,
  playingSet = [],
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
    highlightEnabled,
    octaveHighlight,
    playingAbs,
    playingSet,
  });

  const handleFretClick = useFretClick({ soundType, onPlayNote });

  return (
    <div
      data-string-index={idx}
      className="relative grid grid-cols-[repeat(auto-fit,minmax(48px,1fr))] gap-1 guitar-string"
    >
      <OffsetField value={offset} onChange={setOffset} />
      {fretDescriptors.map((descriptor) => (
        <StringFret
          key={descriptor.fret}
          descriptor={descriptor}
          onClick={handleFretClick}
          reduceAnimations={reduceAnimations}
          trailLength={trailLength}
          minimalHighlight={minimalHighlight}
        />
      ))}
    </div>
  );
};

export default GuitarString;
