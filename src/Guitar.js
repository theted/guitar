import GuitarString from './GuitarString';
import { keyToOffset } from './music';
import Debug from './Debug';

const Guitar = ({ strings, frets, scale, scales, tunings, tuning }) => {
  const stringsObj = Array.from(Array(strings).keys());
  const fretsObj = Array.from(Array(frets + 1).keys());

  return (
    <div className="guitar">
      <div className="strings">
        {stringsObj.reverse().map((i) => (
          <GuitarString
            key={i}
            frets={frets}
            note={keyToOffset(tuning[i])}
            scale={scale}
            scales={scales}
          />
        ))}
      </div>
      <div className="string stringmarker">
        {fretsObj.map((f) => (
          <div key={f} className="marker">
            {f}
          </div>
        ))}
      </div>
      <Debug data={{ scales, tunings, tuning }} />
    </div>
  );
};

export default Guitar;
