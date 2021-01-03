import { useState } from 'react';
import cx from 'classnames';
import { getNote, getKey, getTones, keyToOffset } from './music';
import Field from './Field';

const GuitarString = ({
  note,
  frets,
  scales,
  scale,
  keyy,
}) => {
  const [offset, setOffset] = useState(0);
  const elements = Array.from(Array(frets + 1).keys());
  const tones = getTones(scales[scale], frets);

  return (
    <div className="string">
      <Field onChange={setOffset} value={offset} type="number" className="spec" />

      {elements.map((val) => {
        const actualNote = note + val + offset;
        const isSelected = tones.includes(actualNote + keyToOffset(keyy));

        return (
          <div
            key={val}
            className={cx(
              'note',
              `tone-${getKey(actualNote)}`,
              isSelected && 'selected',
              // eslint-disable-next-line eqeqeq
              getKey(actualNote) == keyToOffset(keyy) && 'base',
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
