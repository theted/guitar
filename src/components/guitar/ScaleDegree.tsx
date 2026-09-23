import React from "react";
import cx from "classnames";
import { toneAnimationManager } from "@/lib/tone-animation";

type ScaleDegreeProps = {
  label: string;
  /** Interval name relative to the tonic, e.g. "m3" */
  interval?: string;
  abs: number;
  isTonic: boolean;
};

const ScaleDegree: React.FC<ScaleDegreeProps> = React.memo(({
  label,
  interval,
  abs,
  isTonic,
}) => {
  const ref = React.useRef<HTMLLIElement | null>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    // The legend shows degrees, not pitches — it lights up for its tone in
    // whichever octave the phrase happens to be playing.
    toneAnimationManager.applyToneClass(element, abs, { anyOctave: true });
    return () => { toneAnimationManager.clearToneClass(element); };
  }, [abs]);

  return (
    <li
      ref={ref}
      className="relative flex min-w-[2.6rem] flex-col items-center gap-1 rounded-md px-1.5 pb-2 pt-1"
      data-pc={abs % 12}
    >
      <span className="text-[0.7rem] font-medium text-ink-3">{interval}</span>
      <span className="type-wide text-xl font-bold leading-none text-ink">{label}</span>
      <span
        className={cx(
          "absolute inset-x-1.5 bottom-0 h-1 rounded-full",
          isTonic ? "bg-tonic" : "bg-line"
        )}
        aria-hidden
      />
      <span className="tone-overlay" />
    </li>
  );
});

export default ScaleDegree;
