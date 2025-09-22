import React, { useState, useEffect, useRef } from "react";
import cx from "classnames";
import { getNoteWithOctave, getScalePitchClasses, keyToOffset } from "@/music";
import { SoundType } from "@/audio";
import { scheduler } from "@/scheduler";
import Field from "@/components/common/Field";
import { ScaleName, scales } from "@/constants";
import { toneAnimationManager } from "@/lib/tone-animation";

type Props = {
  idx: number;
  note: number;
  frets: number;
  scales: typeof scales;
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
  playingIndex?: number | null;
  onPlayNote?: (absSemitone: number, durationMs?: number) => void;
};

const GuitarString: React.FC<Props> = ({
  idx,
  note,
  frets,
  scales,
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
  playingIndex,
  onPlayNote,
}) => {
  const [offset, setOffset] = useState<number>(0);
  const elements = Array.from({ length: frets + 1 }, (_, i) => i);
  const pcs = getScalePitchClasses(scales[scale]);
  const keyOffset = keyToOffset(keyy);
  const elementRefs = useRef<(HTMLDivElement | null)[]>([]);

  return (
    <div className="relative grid grid-cols-[repeat(auto-fit,minmax(48px,1fr))] gap-1 guitar-string">
      <Field
        onChange={(v) => setOffset(parseInt(v, 10) || 0)}
        value={String(offset)}
        type="number"
        className="absolute left-2 top-1 opacity-0 hover:opacity-100 w-16 text-xs"
      />

      {elements.map((val) => {
        const actualNote = note + val + offset;
        const relPc = (((actualNote - keyOffset) % 12) + 12) % 12;
        const isSelected = pcs.includes(relPc);
        const isBase = relPc === 0;
        const showScaleHighlight = isSelected && (!scaleHighlightBottomOnly || isBottom);
        const degree = isSelected ? pcs.indexOf(relPc) + 1 : null;
        const isPlayingNote =
          highlightEnabled && playingSet.includes(actualNote);
        const isPlayingOctave =
          highlightEnabled &&
          octaveHighlight &&
          typeof playingAbs === "number" &&
          Math.floor(playingAbs / 12) === Math.floor(actualNote / 12) &&
          isSelected;

        const baseClasses =
          "relative flex items-center justify-center text-sm md:text-base h-16 md:h-20 rounded-md border transition-transform transition-colors duration-75 cursor-pointer select-none";
        const colorClasses = isBase && showScaleHighlight
          ? "bg-black/70 text-white border-white/20"
          : showScaleHighlight
          ? "bg-zinc-700/60 text-white border-white/10"
          : "bg-zinc-800/40 text-zinc-100 border-white/10";
        const playingClasses = "";

        return (
          <div
            key={val}
            ref={(el) => {
              elementRefs.current[val] = el;
              if (el) {
                toneAnimationManager.applyToneClass(el, actualNote);
              }
            }}
            data-abs={actualNote}
            className={cx(
              baseClasses,
              colorClasses,
              playingClasses,
              "fret-button",
              reduceAnimations
                ? ""
                : "hover:bg-white/20 transition-transform duration-75 hover:scale-[1.03]"
            )}
            onClick={() => {
              scheduler.triggerNow(
                actualNote,
                300,
                soundType,
                (abs, durMs) => onPlayNote?.(abs, durMs)
              );
            }}
          >
            {getNoteWithOctave(actualNote)}
            {/* {(isSelected || isBase) && !minimalHighlight && (
              <span className={cx('absolute bottom-1 left-1.5 w-2 h-2 rounded-full', isBase ? 'bg-emerald-400' : 'bg-amber-400')} />
            )} */}
            {showScaleHighlight && degree && !minimalHighlight && (
              <span
                className={cx(
                  "absolute top-1 right-1 text-[11px] px-1 py-0.5 rounded",
                  isBase ? "bg-emerald-500/30" : "bg-amber-500/30"
                )}
              >
                {degree}
              </span>
            )}
            {/* Tone-based animation overlay */}
            <span className="tone-overlay" />
            
            {/* Legacy fallback overlays */}
            {isPlayingNote && (
              <span
                className="note-fade-overlay note-fade-strong"
                style={{ animationDuration: `${trailLength}ms` }}
              />
            )}
            {!isPlayingNote && isPlayingOctave && !reduceAnimations && (
              <span
                className="note-fade-overlay note-fade-weak"
                style={{ animationDuration: `${trailLength}ms` }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GuitarString;
