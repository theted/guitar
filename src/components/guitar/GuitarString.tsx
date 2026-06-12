import React, { useCallback } from "react";
import cx from "classnames";
import { SoundType, ensureAudioInitialized } from "@/audio";
import { scheduler } from "@/scheduler";
import { scales as baseScales, type ScaleName } from "@/constants";
import { toneAnimationManager } from "@/lib/tone-animation";
import { intervalName } from "@/theory/intervals";
import { useStringNotes, type FretDescriptor } from "./hooks/useStringNotes";

type ScaleDefinition = typeof baseScales;

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
  /** Low-based string index (0 = lowest string), for positional flashes */
  stringIndex: number;
  onClick: (note: number) => void;
  reduceAnimations: boolean;
  minimalHighlight: boolean;
};

// Memoized: ~150 instances render per fretboard; descriptor identity is stable
// (useStringNotes memo) so unrelated store changes skip all of them.
const StringFret: React.FC<StringFretProps> = React.memo(({ descriptor, stringIndex, onClick, reduceAnimations, minimalHighlight }) => {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    toneAnimationManager.applyToneClass(element, descriptor.actualNote, {
      stringIndex,
      fret: descriptor.fret,
    });
    return () => { toneAnimationManager.clearToneClass(element); };
  }, [descriptor.actualNote, descriptor.fret, stringIndex]);

  const chordActive = descriptor.chordTone !== null;
  const positionActive = descriptor.inPosition !== null;
  // While practicing a position, everything outside the box recedes
  const outsidePosition = positionActive && !descriptor.inPosition;
  const colorClasses = outsidePosition
    ? "bg-zinc-900/40 text-zinc-600 border-white/[0.04]"
    : chordActive && descriptor.chordTone
    ? descriptor.isChordRoot
      ? "bg-cyan-950/80 text-white border-cyan-400/60"
      : "bg-zinc-600/70 text-white border-cyan-400/30"
    : chordActive && descriptor.showScaleHighlight
    ? "bg-zinc-800/40 text-zinc-400 border-white/10" // scale note dimmed while a chord is shown
    : descriptor.isBase && descriptor.showScaleHighlight
    ? "bg-black/70 text-white border-white/20"
    : descriptor.showScaleHighlight
    ? "bg-zinc-700/60 text-white border-white/10"
    : "bg-zinc-800/40 text-zinc-100 border-white/10";

  return (
    <div
      ref={ref}
      data-abs={descriptor.actualNote}
      title={`${descriptor.label} · ${intervalName(descriptor.relativePc)}`}
      className={cx(
        "relative flex items-center justify-center text-sm md:text-base h-16 md:h-20 rounded-md border transition-transform transition-colors duration-75 cursor-pointer select-none",
        colorClasses,
        "fret-button",
        reduceAnimations ? "" : "hover:bg-white/20 transition-transform duration-75 hover:scale-[1.03]"
      )}
      onClick={() => onClick(descriptor.actualNote)}
    >
      {descriptor.label}
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
});

type Props = {
  idx: number;
  /** Low-based string index (0 = lowest string) */
  stringIndex: number;
  note: number;
  frets: number;
  scales?: ScaleDefinition;
  scale: ScaleName;
  keyy: string;
  scaleHighlightBottomOnly?: boolean;
  isBottom?: boolean;
  reduceAnimations?: boolean;
  minimalHighlight?: boolean;
  soundType?: SoundType;
  selectedChordDegree?: number | null;
  /** Frets of the active practice position on this string, null when off */
  positionFrets?: Set<number> | null;
  onPlayNote?: (absSemitone: number, durationMs?: number, source?: 'fretboard' | 'phrase') => void;
}

const GuitarString: React.FC<Props> = React.memo(({
  idx: _idx,
  stringIndex,
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
  selectedChordDegree = null,
  positionFrets = null,
  onPlayNote,
}) => {
  const fretDescriptors = useStringNotes({
    note,
    frets,
    scale,
    keyy,
    scaleMap: scales,
    scaleHighlightBottomOnly,
    isBottom,
    selectedChordDegree,
    positionFrets,
  });

  const handleFretClick = useFretClick({ soundType, onPlayNote });

  return (
    <div
      className="relative grid gap-1 guitar-string"
      style={{ gridTemplateColumns: `repeat(${frets + 1}, minmax(44px, 1fr))` }}
    >
      {fretDescriptors.map((descriptor) => (
        <StringFret
          key={descriptor.fret}
          descriptor={descriptor}
          stringIndex={stringIndex}
          onClick={handleFretClick}
          reduceAnimations={reduceAnimations}
          minimalHighlight={minimalHighlight}
        />
      ))}
    </div>
  );
});

export default GuitarString;
