import { computePositions, positionAtFret } from './useScalePositions';
import type { ScaleName } from '@/constants';

const STANDARD = [-24, -19, -14, -9, -5, 0];
const positionsFor = (scale: ScaleName, span: number) =>
  computePositions({ baseNotes: STANDARD, frets: 24, tone: 'e', scale, span });

describe('positionAtFret', () => {
  it.each<ScaleName>(['major', 'pentatonic', 'blues', 'harmonic minor'])(
    'keeps the hand in place when the span changes (%s)',
    (scale) => {
      for (const [from, to] of [[4, 6], [6, 4], [5, 4], [4, 5]]) {
        for (const position of positionsFor(scale, from)) {
          const after = positionsFor(scale, to);
          const index = positionAtFret(after, position.lowFret);
          expect(index).not.toBeNull();
          const kept = after[index! - 1];
          // Same starting fret, or the box that now covers it
          expect(kept.lowFret <= position.lowFret && position.lowFret <= kept.highFret).toBe(true);
        }
      }
    }
  );

  it('finds nothing on an empty neck', () => {
    expect(positionAtFret([], 3)).toBeNull();
  });
});
