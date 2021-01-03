import Field from './Field';
import Select from './Select';
import Debug from './Debug';

const Controls = ({
  scale,
  scales,
  setScale,
  frets,
  setFrets,
  strings,
  setStrings,
  tunings,
  setTuning,
  tones,
  setTone,
}) => (
  <div className="controls" style={{ paddingLeft: '100px' }}>
    <Field onChange={setFrets} value={frets} type="number" min="1" max="100" />
    <Field onChange={setStrings} value={strings} type="number" min="1" max="100" />
    <Select options={Object.keys(scales)} defaultValue={scale} onChange={setScale} />
    <Select options={Object.keys(tunings)} onChange={setTuning} />
    <Select options={(tones)} onChange={setTone} />
    <Debug data={{ scales, scale, setScale }} />
  </div>
);

export default Controls;
