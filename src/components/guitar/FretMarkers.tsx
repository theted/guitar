import React from "react";
import cx from "classnames";
import { inlayAt, neckColumns } from "./geometry";

type FretMarkersProps = {
  frets: number;
};

// Fret numbers under the neck, lined up with the fret columns. The inlaid
// frets are the ones players navigate by, so they carry the weight.
const FretMarkers: React.FC<FretMarkersProps> = React.memo(({ frets }) => (
  <div
    className="tabular mt-1.5 grid select-none text-xs"
    style={{ gridTemplateColumns: neckColumns(frets) }}
    aria-hidden
  >
    {Array.from({ length: frets + 1 }, (_, fret) => (
      <div
        key={fret}
        className={cx("text-center", inlayAt(fret) ? "font-semibold text-ink" : "text-ink-3")}
      >
        {fret}
      </div>
    ))}
  </div>
));

export default FretMarkers;
