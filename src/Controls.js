const Controls = ({
  scale,
  scales,
  setScale,
  frets,
  setFrets,
  strings,
  setStrings,
  tuning,
  tunings,
  setTuning,
  tone,
  tones,
  setTone,
}) => (
  <div className="controls">
    <input
      onChange={({ target: { value } }) => {
        setFrets(value);
      }}
      value={frets}
      type="number"
      min="1"
      max="99"
    />
    <input
      onChange={({ target: { value } }) => {
        setStrings(value);
      }}
      value={strings}
      type="number"
      min="1"
      max="99"
    />
    <select
      onChange={({ target: { value } }) => {
        setScale(value);
      }}
      value={scale}
    >
      {Object.keys(scales).map((ss) => (
        <option key={ss} value={ss}>
          {ss}
        </option>
      ))}
    </select>
    <select
      value={tuning}
      onChange={({ target: { value } }) => {
        setTuning(value);
      }}
    >
      {Object.keys(tunings).map((ss) => (
        <option key={ss} value={ss}>
          {ss}
        </option>
      ))}
    </select>
    <select
      value={tone}
      onChange={({ target: { value } }) => {
        setTone(value);
      }}
    >
      {tones.map((ss) => (
        <option key={ss} value={ss}>
          {ss.toUpperCase()}
        </option>
      ))}
    </select>
    <pre className="debug">
      {JSON.stringify({ scales, scale, setScale }, null, 2)}
    </pre>
  </div>
);

export default Controls;
