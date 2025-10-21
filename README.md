# Guitar Scale Finder

An interactive web application for visualizing and practicing guitar scales. Learn scales across different tunings, hear them played back with various instruments, and explore different musical patterns and phrases.

![guitar scale finder](http://sundbergmedia.com/files/guitar.png)

## Overview

Guitar Scale Finder is a React-based educational tool that helps guitarists visualize, understand, and practice scales on a virtual fretboard. The app features interactive playback, customizable instrument configurations, and a variety of musical patterns to help you master scales in any key.

## Features

### Scale & Music Theory
- Multiple scales including major, minor, pentatonic, blues, and more
- All 12 keys (chromatic tones)
- Configurable starting octave
- Visual highlighting of scale notes on the fretboard
- Octave highlighting to understand note relationships

### Playback & Phrases
- Automated phrase playback with adjustable BPM (30-700)
- 20+ practice patterns including:
  - Full scale runs (ascending/descending)
  - Interval exercises (thirds, fourths, sixths)
  - Motif patterns (1-2-3-2, four-note groups)
  - Guitar techniques (alternate picking, sweep arpeggios, tremolo)
  - Advanced patterns (neo-classical, polyrhythms, djent palm mutes)
  - Chord patterns (triads, sevenths, power chords)
- Loop mode for continuous practice
- Swing rhythm option
- Adjustable octave range (1-5 octaves)
- "Once per tone" mode to play each note only once

### Instrument Configuration
- Multiple tuning presets (standard, drop D, open tunings, etc.)
- Customizable number of strings (1-100)
- Customizable number of frets (1-100)
- Low string at top or bottom display option

### Sound Options
15 different instrument sounds:
- Acoustic: Marimba, Piano, Organ, Bells, Strings, Flute, Brass
- Synthesizers: Sine, Square, Saw, Synth Lead, Synth Pad
- Guitar: Clean Guitar, Distorted Guitar, Bass

### Visual Customization
- Note highlighting during playback
- Adjustable trail length (100-4000ms)
- Minimal highlight mode
- Legend-only mode
- Reduce animations option for performance

## Getting Started

### Installation

```bash
# Install dependencies
yarn install

# Start development server
yarn start
```

The app will open at [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
# Run tests
yarn test

# Create production build
yarn build
```

## Usage

### Basic Usage

1. **Select a Scale**: Choose from the scale dropdown (major, minor, pentatonic, etc.)
2. **Choose a Key**: Pick any of the 12 chromatic keys
3. **View the Fretboard**: Notes in the selected scale are highlighted on the fretboard
4. **Click Notes**: Click any highlighted note to hear it

### Playing Phrases

1. Select a phrase pattern from the "Phrase" dropdown
2. Click the play button to hear the pattern
3. Watch the visual feedback as notes are played
4. Adjust BPM, octaves, and other settings to customize the playback
5. Enable "Loop" to practice continuously

### Customizing Your Instrument

1. Choose a tuning preset or keep standard tuning
2. Adjust the number of strings and frets
3. Select your preferred sound from 15 instrument options
4. Toggle "Low string at bottom" for traditional tab-style orientation

### Practice Tips

- Start with "Full Scale" phrase at a slow BPM (60-80)
- Use "Loop" mode and gradually increase tempo
- Try "Thirds" or "Fourths" to practice interval recognition
- Enable "Once per tone" to focus on note positions without repetition
- Use "Minimal highlight" for cleaner visual feedback

## Development

### Available Scripts

- `yarn start` - Run development server
- `yarn dev` - Alternative dev server command
- `yarn build` - Build for production (includes TypeScript checking)
- `yarn preview` - Preview production build
- `yarn test` - Run tests in watch mode
- `yarn test:ui` - Run tests with UI
- `yarn coverage` - Generate test coverage report

### Technology Stack

- React 19 with TypeScript
- Vite for build tooling
- Zustand for state management
- Tailwind CSS for styling
- Radix UI for accessible components
- Framer Motion for animations
- Web Audio API for sound generation

## Design Philosophy

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
