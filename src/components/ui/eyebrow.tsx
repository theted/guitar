import * as React from "react";

// Tiny row label used by the strips above the fretboard (Scale / Chords /
// Positions) so each button row says what it is.
const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="w-16 shrink-0 pt-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white/30 select-none">
    {children}
  </span>
);

export default Eyebrow;
