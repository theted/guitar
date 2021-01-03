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

const getTones = (scale, steps, key) => {
  let step = 0;
  const ret = [];

  // TODO: need to take offset into account
  while(step < steps + 9) {
    const rest = scale.map((interval) => {
        // eslint-disable-next-line no-plusplus
      step += interval;
      return step;
    });

    ret.push(...rest);
  }

  return [0, ...ret]; // in order to include base tone...
};

export {
  getNote,
  getKey,
  getTones,
  keyToOffset,
};
