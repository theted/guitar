import React from "react";

type FretMarkersProps = {
  markers: number[];
};

const FretMarkers: React.FC<FretMarkersProps> = ({ markers }) => {
  return (
    <div
      className="grid gap-1 mt-3 text-sm opacity-60 select-none"
      style={{ gridTemplateColumns: `repeat(${markers.length}, minmax(44px, 1fr))` }}
    >
      {markers.map((fret) => (
        <div key={fret} className="text-center">
          {fret}
        </div>
      ))}
    </div>
  );
};

export default FretMarkers;
