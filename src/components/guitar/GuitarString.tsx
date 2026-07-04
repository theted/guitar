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
  /** String wire thickness in px (gauge: low strings are thicker) */
  wireHeight: number;
  onClick: (note: number) => void;
  minimalHighlight: boolean;
};

// Scale-diagram vernacular: in-scale notes are filled inlay dots on the
// string wire (hollow rings on the open string, like chord charts), the root
// is emerald, chord tones go cyan, and everything else recedes to a faint
// label so the scale shape reads at a glance.
const dotClasses = (d: FretDescriptor): string | null => {
  const open = d.fret === 0;
  const outsidePosition = d.inPosition !== null && !d.inPosition;
  const chordActive = d.chordTone !== null;

  if (outsidePosition) {
    return d.showScaleHighlight ? "bg-white/[0.08] text-white/25" : null;
  }
  if (chordActive && d.chordTone) {
    if (d.isChordRoot) {
      return open
        ? "border-2 border-cyan-300 text-cyan-100 ring-2 ring-cyan-300/25"
        : "bg-cyan-300 text-cyan-950 ring-2 ring-cyan-300/30";
    }
    return open
      ? "border-2 border-cyan-300/80 text-cyan-100"
      : "bg-cyan-400/90 text-cyan-950";
  }
  if (chordActive && d.showScaleHighlight) {
    // Scale note dimmed while a chord is shown
    return "bg-white/15 text-white/55";
  }
  if (d.isBase && d.showScaleHighlight) {
    return open
      ? "border-2 border-emerald-400 text-emerald-200"
      : "bg-emerald-400 text-emerald-950";
  }
  if (d.showScaleHighlight) {
    return open
      ? "border-2 border-white/60 text-white/90"
      : "bg-white/85 text-zinc-900";
  }
  return null;
};

// Memoized: ~150 instances render per fretboard; descriptor identity is stable
// (useStringNotes memo) so unrelated store changes skip all of them.
const StringFret: React.FC<StringFretProps> = React.memo(({ descriptor, stringIndex, wireHeight, onClick, minimalHighlight }) => {
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

  const dot = dotClasses(descriptor);
  const outsidePosition = descriptor.inPosition !== null && !descriptor.inPosition;

  return (
    <div
      ref={ref}
      data-abs={descriptor.actualNote}
      title={`${descriptor.label} · ${intervalName(descriptor.relativePc)}`}
      className={cx(
        "group relative flex items-center justify-center h-16 md:h-20 cursor-pointer select-none",
        "fret-button fret-cell transition-colors duration-75 hover:bg-white/[0.05]",
        descriptor.fret === 0 && "fret-cell--open"
      )}
      onClick={() => onClick(descriptor.actualNote)}
    >
      <span className="string-wire" style={{ height: `${wireHeight}px` }} aria-hidden="true" />
      {/* Tone-based animation overlay — glows behind the dot */}
      <span className="tone-overlay" />
      {dot ? (
        <span
          className={cx(
            "relative flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full",
            "text-[11px] md:text-xs font-semibold tracking-tight",
            dot
          )}
        >
          {descriptor.label}
        </span>
      ) : (
        <span
          className={cx(
            "relative text-[11px] md:text-xs transition-colors duration-75",
            outsidePosition ? "text-white/10" : "text-white/25 group-hover:text-white/60"
          )}
        >
          {descriptor.label}
        </span>
      )}
      {descriptor.showScaleHighlight && descriptor.degree && !minimalHighlight && !outsidePosition && (
        <span className="absolute top-1 right-1.5 text-[10px] px-1 rounded bg-white/[0.07] text-white/45 tabular-nums">
          {descriptor.degree}
        </span>
      )}
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
  minimalHighlight?: boolean;
  soundType?: SoundType;
  selectedChordDegree?: number | null;
  /** String wire thickness in px (gauge: low strings are thicker) */
  wireHeight?: number;
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
  minimalHighlight = false,
  soundType = "marimba",
  selectedChordDegree = null,
  wireHeight = 2,
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
      className="relative grid guitar-string"
      style={{ gridTemplateColumns: `repeat(${frets + 1}, minmax(44px, 1fr))` }}
    >
      {fretDescriptors.map((descriptor) => (
        <StringFret
          key={descriptor.fret}
          descriptor={descriptor}
          stringIndex={stringIndex}
          wireHeight={wireHeight}
          onClick={handleFretClick}
          minimalHighlight={minimalHighlight}
        />
      ))}
    </div>
  );
});

export default GuitarString;
