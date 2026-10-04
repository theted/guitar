// Keyboard movement around the neck. Arrows follow the screen, not the
// instrument: up is the row drawn above (whichever way the strings are
// flipped), and right is the fret drawn to the right (towards the nut on a
// left-handed neck).

/** A fret on a string; `stringIndex` counts from the lowest string (0) */
export type NeckCell = { stringIndex: number; fret: number };

type NeckShape = {
  /** Low-based string indices in the order they're drawn, top row first */
  rowOrder: readonly number[];
  frets: number;
  /** The neck is mirrored (left-handed), so right means lower frets */
  mirrored: boolean;
};

/** Where `key` moves the cursor, or null if it isn't a movement key */
export const nextCell = (cell: NeckCell, key: string, shape: NeckShape): NeckCell | null => {
  const { rowOrder, frets, mirrored } = shape;
  const row = Math.max(0, rowOrder.indexOf(cell.stringIndex));
  const along = (delta: number) => ({
    stringIndex: cell.stringIndex,
    fret: Math.min(frets, Math.max(0, cell.fret + delta)),
  });
  const across = (delta: number) => ({
    stringIndex: rowOrder[Math.min(rowOrder.length - 1, Math.max(0, row + delta))],
    fret: cell.fret,
  });
  switch (key) {
    case "ArrowRight": return along(mirrored ? -1 : 1);
    case "ArrowLeft": return along(mirrored ? 1 : -1);
    case "ArrowUp": return across(-1);
    case "ArrowDown": return across(1);
    case "Home": return { stringIndex: cell.stringIndex, fret: 0 };
    case "End": return { stringIndex: cell.stringIndex, fret: frets };
    default: return null;
  }
};
