// Display-only typography for note names. The theory layer spells with ASCII
// ("Bb", "F#") so names stay easy to parse and compare; the screen gets the
// real accidentals.
export const pretty = (name: string): string =>
  name.charAt(0) + name.slice(1).replace(/#/g, '♯').replace(/b/g, '♭');
