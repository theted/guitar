import { fingerSequence } from './fingering';

// Standard tuning, low string first: E2 A2 D3 G3 B3 E4 (abs, E4 = 0)
const STANDARD = [-24, -19, -14, -9, -5, 0];

const sounds = (locations: ReturnType<typeof fingerSequence>, notes: number[]) =>
  locations.every((loc, i) => loc !== null && STANDARD[loc.stringIndex] + loc.fret === notes[i]);

describe('fingerSequence', () => {
  it('plays E major up two octaves in open position, as a player would', () => {
    const notes = [-24, -22, -20, -19, -17, -15, -13, -12, -10, -8, -7, -5, -3, -1, 0];
    const fingering = fingerSequence(notes, STANDARD, 24);
    expect(sounds(fingering, notes)).toBe(true);
    expect(fingering.slice(0, 8)).toEqual([
      { stringIndex: 0, fret: 0 }, { stringIndex: 0, fret: 2 }, { stringIndex: 0, fret: 4 },
      { stringIndex: 1, fret: 0 }, { stringIndex: 1, fret: 2 }, { stringIndex: 1, fret: 4 },
      { stringIndex: 2, fret: 1 }, { stringIndex: 2, fret: 2 },
    ]);
    expect(Math.max(...fingering.map((loc) => loc!.fret))).toBeLessThanOrEqual(4);
  });

  it('comes back down the same way it went up', () => {
    const up = [-24, -22, -20, -19, -17];
    const fingering = fingerSequence([...up, ...up.slice(0, -1).reverse()], STANDARD, 24);
    expect(fingering.slice(5)).toEqual(fingering.slice(0, 4).reverse());
  });

  it('shifts up the neck only when a note is out of reach', () => {
    // High E string, climbing past the first position
    const notes = [0, 2, 4, 5, 7, 9];
    const fingering = fingerSequence(notes, STANDARD, 24);
    expect(sounds(fingering, notes)).toBe(true);
    // Everything playable without leaving the nut stays there
    expect(fingering[0]).toEqual({ stringIndex: 5, fret: 0 });
    expect(fingering[2]).toEqual({ stringIndex: 5, fret: 4 });
    // Nothing is ever stretched further than the hand reaches
    const frets = fingering.map((loc) => loc!.fret).filter((fret) => fret > 0);
    expect(Math.max(...frets) - Math.min(...frets.slice(-2))).toBeLessThanOrEqual(3);
  });

  it('starts from the only place a note exists', () => {
    // A5 exists only on the top string, fret 17
    expect(fingerSequence([17], STANDARD, 24)).toEqual([{ stringIndex: 5, fret: 17 }]);
  });

  it('returns null for notes off the neck', () => {
    expect(fingerSequence([-30, 40], STANDARD, 24)).toEqual([null, null]);
  });
});
