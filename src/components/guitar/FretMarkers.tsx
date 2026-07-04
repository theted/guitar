import React from "react";

type FretMarkersProps = {
  markers: number[];
};

// Inlay positions repeat every octave: single dots at 3/5/7/9, a double dot
// at the octave (12, 24, …). The strip mirrors a real neck instead of
// numbering every fret; numerals appear only where a marker sits.
const inlayKind = (fret: number): "none" | "single" | "double" => {
  if (fret === 0) return "none";
  const pos = fret % 12;
  if (pos === 0) return "double";
  return pos === 3 || pos === 5 || pos === 7 || pos === 9 ? "single" : "none";
};

const Dot: React.FC = () => (
  <span className="w-1.5 h-1.5 rounded-full bg-white/35" aria-hidden="true" />
);

const FretMarkers: React.FC<FretMarkersProps> = ({ markers }) => {
  return (
    <div
      className="grid h-10 border-t border-white/[0.08] bg-black/20 select-none"
      style={{ gridTemplateColumns: `repeat(${markers.length}, minmax(44px, 1fr))` }}
    >
      {markers.map((fret) => {
        const kind = inlayKind(fret);
        return (
          <div key={fret} className="flex flex-col items-center justify-center gap-1">
            {kind !== "none" && (
              <>
                <span className="flex gap-1">
                  <Dot />
                  {kind === "double" && <Dot />}
                </span>
                <span className="text-[9px] leading-none text-white/40 tabular-nums">
                  {fret}
                </span>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FretMarkers;
