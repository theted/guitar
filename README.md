# Guitar Scale Finder

An interactive web application for visualizing and practicing guitar scales. Learn scales across different tunings, hear them played back with various instruments, and explore different musical patterns and phrases.

![guitar scale finder](http://sundbergmedia.com/files/guitar.png)

## Overview

Guitar Scale Finder is a React-based educational tool that helps guitarists visualize, understand, and practice scales on a virtual fretboard. The app features interactive playback, customizable instrument configurations, and a variety of musical patterns to help you master scales in any key.

## Features

### Scale & music theory
- 24 scales including major, minor, pentatonic, blues and the modes
- All 12 keys, spelled correctly for the key (F major shows Bb, not A#)
- Scale notes highlighted on the fretboard with their degree and interval name
- Diatonic chord strip: select a chord to see its tones on the neck
- Scale positions (boxes) with a selectable hand span, for one-position practice
- An info panel with the spelled scale, its interval formula and its diatonic chords

### Playback & phrases
- Automated phrase playback with adjustable tempo (30–700 BPM)
- 24 practice patterns:
  - Scale runs — full scale, snake, 1-2-3-2 motif
  - Intervals — thirds, fourths, sixths, four-note groups
  - Arpeggios — chord arpeggio, triads, sevenths, sweep, neo-classical
  - Technique — alternate picking, pedal tone, sequences, skip patterns
  - Metal — power chords, djent palm mutes, polyrhythms, breakdowns, tremolo, legato
- A phrase strip showing the notes about to be played, following along as they sound
- Phrases are laid out on the neck you're looking at — they start at the lowest
  available tonic and never run past the top fret
- Loop mode, swing feel, descending runs, 1–5 octave range

### Instrument configuration
- 28 tuning presets: standard, drop, open, DADGAD, extended range, bass
- 1–12 strings, 1–36 frets
- Low string at top or bottom
- 15 sounds: marimba, piano, organ, bells, strings, flute, brass, five synths,
  clean and distorted guitar, bass

### Sound & visuals
- Master volume with a one-click mute in the top bar
- Note highlighting during playback, with an adjustable trail (100–4000 ms)
- Flash every octave of a note, or only the one being played
- Hide the scale highlighting entirely to test yourself against a blank neck
- Show the scale on the lowest string only, so each tone appears once
- Reduce animations (respects `prefers-reduced-motion` on first run)

### Keyboard shortcuts
- `Space` — play / pause
- `Escape` — stop
- `↑` / `↓` — tempo

## Getting started

```bash
npm install
npm start
```

The app opens at [http://localhost:5173](http://localhost:5173).

### Building for production

```bash
npm run test:run   # run the test suite once
npm run build      # type-check and build
npm run preview    # serve the production build
```

## Usage

### Basic usage

1. **Select a scale** from the dropdown in the top bar
2. **Choose a key** — the fretboard highlights the scale's notes with their degrees
3. **Click any fret** to hear that note
4. **Press play** (or `Space`) to hear the current phrase

### Playing phrases

1. Open **Settings → Scale** and pick a phrase pattern
2. Press play; the phrase strip above the neck shows what's coming and lights up each note as it sounds
3. Adjust tempo, octaves, swing and descent to taste
4. Enable **Loop** to practice continuously

### Practicing a position

1. Pick a box from the position strip (P1, P2, …) above the neck
2. Everything outside the box dims
3. Press play — the box is played one fret at a time, and exactly the fret to play lights up

### Practice tips

- Start with **Full Scale** at 60–80 BPM, then use **Loop** and raise the tempo
- **Thirds** and **Fourths** train interval recognition
- **Lowest string only** shows each tone once, which makes the pattern along the neck obvious
- Turn off **Show scale on fretboard** to quiz yourself — played notes still flash
- Select a chord from the chord strip and switch to the **Chord Arpeggio** phrase to hear it

## Development

### Available scripts

- `npm start` / `npm run dev` — dev server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build
- `npm test` — tests in watch mode
- `npm run test:run` — tests once
- `npm run coverage` — coverage report
- `npm run lint` / `npm run lint:fix` — lint

### Technology stack

- React 19 with TypeScript
- Vite for build tooling
- Zustand for state management (persisted to localStorage)
- Tailwind CSS 4 for styling
- Radix UI for the accessible select
- Web Audio API for sound, Web Animations API for note flashes

See [AGENTS.md](AGENTS.md) for an architecture walkthrough.

## Design philosophy

- **Simplicity**: Each component has a single, clear responsibility
- **Architecture**: Logical and easy to understand code structure
- **Data Flow**: Clear, unidirectional state management
- **Code Quality**: TypeScript, tests, and best practices throughout

## History

This is a modern React rewrite of a [2015 CodePen](https://codepen.io/theted/pen/zrvaYP), rebuilt from the ground up to explore current best practices in React development, TypeScript, and modern web audio.

## License

ISC

## Author

Fredrik Sundberg <fredrik@sundbergmedia.com>
