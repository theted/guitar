import React, { useCallback } from "react";
import { SoundType, ensureAudioInitialized } from "@/audio";
import { scheduler } from "@/scheduler";
import { scales as baseScales, type ScaleName } from "@/constants";
import { toneAnimationManager } from "@/lib/tone-animation";
import { pretty } from "@/lib/notation";
import { intervalName } from "@/theory/intervals";
import type { LabelMode } from "@/store";
import { useStringNotes, type FretDescriptor } from "./hooks/useStringNotes";
import type { PlayNoteFn } from "@/hooks/usePlayback";

type ScaleDefinition = typeof baseScales;

type UseFretClickArgs = {
  soundType: SoundType;
  onPlayNote?: PlayNoteFn;
};

const useFretClick = ({ soundType, onPlayNote }: UseFretClickArgs) => {
  return useCallback(
    async (note: number) => {
      try {
        await ensureAudioInitialized();
        scheduler.triggerNow(note, 300, soundType, (abs, durMs) => onPlayNote?.(abs, durMs));
      } catch (error) {
        console.error('Failed to play note:', error);
      }
    },
    [soundType, onPlayNote]
  );
};

type FretState = "root" | "scale" | "chord" | "chord-root" | "muted" | "off";

// How a fret is drawn. A selected chord takes over the colouring; the rest of
// the scale stays as small markers so the chord can be seen inside it.
const fretState = (d: FretDescriptor): FretState => {
  if (d.chordTone !== null) {
    if (d.chordTone) return d.isChordRoot ? "chord-root" : "chord";
    return d.showScaleHighlight ? "muted" : "off";
  }
  if (!d.showScaleHighlight) return "off";
  return d.isBase ? "root" : "scale";
};

const withoutOctave = (label: string) => label.replace(/-?\d+$/, "");

const dotText = (d: FretDescriptor, state: FretState, labelMode: LabelMode): string => {
  if (state === "off" || labelMode === "note") return pretty(withoutOctave(d.label));
  if (labelMode === "degree") return d.degree != null ? String(d.degree) : "";
  return intervalName(d.relativePc);
};

type StringFretProps = {
  descriptor: FretDescriptor;
  /** Low-based string index (0 = lowest string), for positional flashes */
  stringIndex: number;
  onClick: (note: number) => void;
  labelMode: LabelMode;
};

// Memoized: ~150 instances render per fretboard; descriptor identity is stable
// (useStringNotes memo) so unrelated store changes skip all of them.
const StringFret: React.FC<StringFretProps> = React.memo(({ descriptor, stringIndex, onClick, labelMode }) => {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    toneAnimationManager.applyToneClass(element, descriptor.actualNote, {
      fret: { stringIndex, fret: descriptor.fret },
    });
    return () => { toneAnimationManager.clearToneClass(element); };
  }, [descriptor.actualNote, descriptor.fret, stringIndex]);

  const state = fretState(descriptor);

  return (
    <div
      ref={ref}
      data-abs={descriptor.actualNote}
      data-state={state}
      data-outside={descriptor.inPosition === false ? "" : undefined}
      title={`${pretty(descriptor.label)} (${intervalName(descriptor.relativePc)})`}
      className={descriptor.fret === 0 ? "fret fret-open" : "fret"}
      onClick={() => onClick(descriptor.actualNote)}
    >
      <span className="fret-dot">{dotText(descriptor, state, labelMode)}</span>
      {/* Tone-based animation overlay — primary highlighting system */}
      <span className="tone-overlay" />
    </div>
  );
});

type Props = {
  /** Low-based string index (0 = lowest string) */
  stringIndex: number;
  /** Total strings, for the gauge */
  stringCount?: number;
  note: number;
  frets: number;
  /** Grid columns shared with the board, see geometry.ts */
  columns?: string;
  scales?: ScaleDefinition;
  scale: ScaleName;
  keyy: string;
  highlightEnabled?: boolean;
  scaleHighlightBottomOnly?: boolean;
  isBottom?: boolean;
  labelMode?: LabelMode;
  soundType?: SoundType;
  selectedChordDegree?: number | null;
  /** Frets of the active practice position on this string, null when off */
  positionFrets?: Set<number> | null;
  onPlayNote?: PlayNoteFn;
}

const GuitarString: React.FC<Props> = React.memo(({
  stringIndex,
  stringCount = 6,
  note,
  frets,
  columns,
  scales = baseScales,
  scale,
  keyy,
  highlightEnabled = true,
  scaleHighlightBottomOnly = false,
  isBottom = false,
  labelMode = "note",
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
    highlightEnabled,
    scaleHighlightBottomOnly,
    isBottom,
    selectedChordDegree,
    positionFrets,
  });

  const handleFretClick = useFretClick({ soundType, onPlayNote });

  // 0 = lowest string. Bass strings are heavier and bronze-wound.
  const t = stringCount > 1 ? stringIndex / (stringCount - 1) : 1;
  const style = {
    gridTemplateColumns: columns ?? `repeat(${frets + 1}, minmax(44px, 1fr))`,
    "--gauge": `${(1 + 2.4 * (1 - t)).toFixed(2)}px`,
    "--string-color": t < 0.5 ? "var(--string-wound)" : "var(--string-plain)",
  } as React.CSSProperties;

  return (
    <div className="neck-string" style={style}>
      {fretDescriptors.map((descriptor) => (
        <StringFret
          key={descriptor.fret}
          descriptor={descriptor}
          stringIndex={stringIndex}
          onClick={handleFretClick}
          labelMode={labelMode}
        />
      ))}
    </div>
  );
});

export default GuitarString;
