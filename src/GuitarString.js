import cx from 'classnames';
import { getNote, getKey, getTones } from './music';

const GuitarString = ({ note, frets, scales, scale }) => {
  const elements = Array.from(Array(frets).keys());
  const tones = getTones(scales[scale], frets);

  return (
    <div className="string">
      {elements.map((val) => {
        const actualNote = note + val;
        const isSelected = tones.includes(actualNote);

        return (
          <div
            key={val}
            className={cx(
              'note',
              `tone-${getKey(actualNote)}`,
              isSelected && 'selected'
            )}
          >
            {getNote(note + val)}
          </div>
        );
      })}
    </div>
  );
};

export default GuitarString;
