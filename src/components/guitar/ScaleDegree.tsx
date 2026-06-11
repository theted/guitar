import React from "react";
import cx from "classnames";
import { toneAnimationManager } from "@/lib/tone-animation";

type ScaleDegreeProps = {
  index: number;
  label: string;
  /** Interval name relative to the tonic, e.g. "m3" */
  interval?: string;
  abs: number;
  isTonic: boolean;
};

const ScaleDegree: React.FC<ScaleDegreeProps> = React.memo(({
  index,
  label,
  interval,
  abs,
  isTonic,
}) => {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    toneAnimationManager.applyToneClass(element, abs);
    return () => { toneAnimationManager.clearToneClass(element); };
  }, [abs]);

  const classes = cx(
    "relative overflow-hidden px-2 py-1 rounded-md text-sm uppercase tracking-wide transition-colors border",
    isTonic
      ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/70"
      : "bg-amber-500/15 text-amber-200 border-amber-400/50"
  );

  return (
    <div ref={ref} className={classes} data-pc={abs % 12}>
      <span className="mr-1 font-semibold">{index + 1}</span>
      {label}
      {interval && (
        <span className="ml-1.5 text-[10px] normal-case opacity-50">{interval}</span>
      )}
      <span className="tone-overlay" />
    </div>
  );
});

export default ScaleDegree;
