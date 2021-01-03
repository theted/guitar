import React, { useState } from 'react';
import Guitar from './Guitar';
import Controls from './Controls';
import './style.css';
import {
  tones, scales, tunings, DEFAULTS,
} from './constants';

const {
  STRINGS, FRETS, TUNING, SCALE, KEY,
} = DEFAULTS;

const App = () => {
  const [scale, setScale] = useState(SCALE);
  const [strings, setStrings] = useState(STRINGS);
  const [frets, setFrets] = useState(FRETS);
  const [tuning, setTuning] = useState(TUNING);
  const [tone, setTone] = useState(KEY);

  const doSetTuning = tuning => setTuning(tunings[tuning]);

  return (
    <div className="App">
      <Controls
        scales={scales}
        scale={scale}
        setScale={setScale}
        frets={frets}
        setFrets={setFrets}
        strings={strings}
        setStrings={setStrings}
        tunings={tunings}
        setTuning={doSetTuning}
        tone={tone}
        tones={tones}
        setTone={setTone}
      />
      <Guitar
        strings={strings}
        frets={frets}
        scale={scale}
        scales={scales}
        tuning={tuning}
        tunings={tunings}
      />
    </div>
  );
};

export default App;
