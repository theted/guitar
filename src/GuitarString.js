import { useState } from 'react';
import cx from 'classnames';
import { getNote, getKey, getTones } from './music';
import Field from './Field';

const GuitarString = ({ note, frets, scales, scale }) => {
  const [offset, setOffset] = useState(0);
  const elements = Array.from(Array(frets).keys());
  const tones = getTones(scales[scale], frets);

  return (
    <div className="string">
      <Field onChange={setOffset} value={offset} type="number" className="debug" />

      {elements.map((val) => {
        const actualNote = note + val + offset;
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
            {getNote(actualNote)}
          </div>
        );
      })}
    </div>
  );
};

export default GuitarString;
