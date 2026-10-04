import { nextCell } from './neckNavigation';

// Six strings drawn low-at-bottom: top row is the high E (index 5)
const lowAtBottom = { rowOrder: [5, 4, 3, 2, 1, 0], frets: 24, mirrored: false };

describe('nextCell', () => {
  it('moves along the string with ← →, stopping at the nut and the last fret', () => {
    expect(nextCell({ stringIndex: 0, fret: 3 }, 'ArrowRight', lowAtBottom)).toEqual({ stringIndex: 0, fret: 4 });
    expect(nextCell({ stringIndex: 0, fret: 0 }, 'ArrowLeft', lowAtBottom)).toEqual({ stringIndex: 0, fret: 0 });
    expect(nextCell({ stringIndex: 0, fret: 24 }, 'ArrowRight', lowAtBottom)).toEqual({ stringIndex: 0, fret: 24 });
  });

  it('moves to the row drawn above or below, however the strings are flipped', () => {
    // Low string at the bottom: up from the low E is the A string
    expect(nextCell({ stringIndex: 0, fret: 5 }, 'ArrowUp', lowAtBottom)).toEqual({ stringIndex: 1, fret: 5 });
    expect(nextCell({ stringIndex: 0, fret: 5 }, 'ArrowDown', lowAtBottom)).toEqual({ stringIndex: 0, fret: 5 });
    // Low string on top: down from the low E is the A string
    const lowOnTop = { ...lowAtBottom, rowOrder: [0, 1, 2, 3, 4, 5] };
    expect(nextCell({ stringIndex: 0, fret: 5 }, 'ArrowDown', lowOnTop)).toEqual({ stringIndex: 1, fret: 5 });
  });

  it('follows the screen on a left-handed neck, where the nut is on the right', () => {
    const mirrored = { ...lowAtBottom, mirrored: true };
    expect(nextCell({ stringIndex: 2, fret: 7 }, 'ArrowRight', mirrored)).toEqual({ stringIndex: 2, fret: 6 });
    expect(nextCell({ stringIndex: 2, fret: 7 }, 'ArrowLeft', mirrored)).toEqual({ stringIndex: 2, fret: 8 });
  });

  it('jumps to the open string and the last fret with Home and End', () => {
    expect(nextCell({ stringIndex: 3, fret: 9 }, 'Home', lowAtBottom)).toEqual({ stringIndex: 3, fret: 0 });
    expect(nextCell({ stringIndex: 3, fret: 9 }, 'End', lowAtBottom)).toEqual({ stringIndex: 3, fret: 24 });
  });

  it('ignores other keys', () => {
    expect(nextCell({ stringIndex: 0, fret: 0 }, 'a', lowAtBottom)).toBeNull();
  });
});
