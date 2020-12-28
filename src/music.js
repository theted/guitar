import { tones } from './constants';

const noteKeys = Object.keys(tones);

const noteMap = tones.reduce(
  (accumulator, target) => ({
    ...accumulator,
    [target]: Object.keys(accumulator).length,
  }),
  {}
);

const getNote = (offset) => tones[offset % tones.length];

const getKey = (offset) => noteKeys[offset % noteKeys.length];

const keyToOffset = (key) => noteMap[key];

// get toneMap for n steps
// TODO: need support for wraparround...
const getTones = (scale, steps, key) => {
  let step = 0;

  const ret = scale.map((interval) => {
    // eslint-disable-next-line no-plusplus
    step += interval;
    return step;
  });

  console.log({ steps, key });

  return [0, ...ret]; // in order to include base tone...
};

export {
  getNote,
  getKey,
  getTones,
  keyToOffset,
};
