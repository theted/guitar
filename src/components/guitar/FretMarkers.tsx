import React from "react";

type FretMarkersProps = {
  markers: number[];
};

const FretMarkers: React.FC<FretMarkersProps> = ({ markers }) => {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(48px,1fr))] gap-1 mt-3 text-sm opacity-60 select-none">
      {markers.map((fret) => (
        <div key={fret} className="text-center">
          {fret}
        </div>
      ))}
    </div>
  );
};

export default FretMarkers;
