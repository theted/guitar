import React from "react";
import cx from "classnames";
import { toneAnimationManager } from "@/lib/tone-animation";

type ScaleDegreeProps = {
  index: number;
  label: string;
  abs: number;
  isTonic: boolean;
  isActive: boolean;
  reduceAnimations: boolean;
  minimalHighlight: boolean;
  trailLength: number;
};

const ScaleDegree: React.FC<ScaleDegreeProps> = ({
  index,
  label,
  abs,
  isTonic,
  isActive,
  reduceAnimations,
  minimalHighlight,
  trailLength,
}) => {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    toneAnimationManager.applyToneClass(element, abs);
  }, [abs]);

  const classes = cx(
    "relative overflow-hidden px-2 py-1 rounded-md text-sm uppercase tracking-wide transition-colors border",
    isActive
      ? "bg-cyan-600/20 text-cyan-100 border-cyan-400"
      : isTonic
      ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/70"
      : "bg-amber-500/15 text-amber-200 border-amber-400/50"
  );

  return (
    <div ref={ref} className={classes} data-pc={abs % 12}>
      <span className="mr-1 font-semibold">{index + 1}</span>
      {label}
      <span className="tone-overlay" />
      {isActive && !reduceAnimations && !minimalHighlight && (
        <span className="note-fade-overlay note-fade-strong" style={{ animationDuration: `${trailLength}ms` }} />
      )}
    </div>
  );
};

export default ScaleDegree;
