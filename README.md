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
- The spelled scale with each note's interval, lit up as it sounds
- Label the neck with note names, scale degrees or intervals

### Playback & phrases
- Automated phrase playback with adjustable tempo (30–700 BPM)
- 24 practice patterns:
  - Scale runs — full scale, snake, 1-2-3-2 motif
  - Intervals — thirds, fourths, sixths, four-note groups
  - Arpeggios — chord arpeggio, triads, sevenths, sweep, neo-classical
  - Technique — alternate picking, pedal tone, sequences, skip patterns
  - Metal — power chords, djent palm mutes, polyrhythms, breakdowns, tremolo, legato
- A phrase strip showing the notes about to be played, following along as they sound
- Phrases are fingered like a player would: they start at the nut, and only the fret being played lights up
  (or light the pitch everywhere, or every octave, if you prefer)
- Phrases are laid out on the neck you're looking at — they start at the lowest
  available tonic and never run past the top fret
- Loop mode, swing feel, descending runs, 1–5 octave range

### Instrument configuration
- 28 tuning presets: standard, drop, open, DADGAD, extended range, bass
- 1–12 strings, 1–36 frets
- Low string at top or bottom, and a left-handed (mirrored) neck
- 15 sounds: marimba, piano, organ, bells, strings, flute, brass, five synths,
  clean and distorted guitar, bass

### Sound & visuals
- A true-to-life neck: rosewood board, inlays, wound bass strings, frets that narrow towards the body
- Light and dark themes following the system setting
- Master volume with a one-click mute in the playback bar
- Note highlighting during playback, with an adjustable trail (100–4000 ms)
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

The screen reads top to bottom: **what** you're looking at, **how** it's shown, and a bar at the bottom for **playing** it.

1. **Choose a key** from the row of twelve keys at the top
2. **Choose a scale** by clicking the title ("E Blues ▾")
3. **Click any fret** to hear that note — the tonic is amber, other scale tones are pearl dots; hover anywhere else to see the note's name
4. **Press play** (or `Space`) in the bottom bar to hear the current pattern

Use **Label notes with** to switch the dots between note names, scale degrees and intervals.
Tuning, strings, frets and display options are under the settings button (top right).

### Playing patterns

1. Pick a **Pattern** in the bottom bar
2. Press play; the phrase strip under the neck shows what's coming and lights up each note as it sounds
3. Adjust octaves, tempo, **Descend** and **Swing** to taste
4. Turn on **Loop** to practice continuously

On a phone, the chevron next to the pattern opens the rest of the playback controls.

### Chords and positions

- Pick a chord under **Chords in this key**: its tones turn teal, the rest of the scale becomes hollow rings
- Pick a numbered **Position**: everything outside the box becomes hollow rings, the neck scrolls to it,
  and Play steps through it one fret at a time, lighting exactly the fret to play

### Practice tips

- Start with **Full scale** at 60–80 BPM, then use **Loop** and raise the tempo
- **Thirds** and **Fourths** train interval recognition
- **Lowest string only** shows each tone once, which makes the pattern along the neck obvious
- Turn off **Show the scale** (settings) to quiz yourself — played notes still flash
- Select a chord and switch to the **Chord arpeggio** pattern to hear it

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
