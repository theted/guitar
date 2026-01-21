# AGENTS.md - AI Agents Onboarding Guide

This document provides a comprehensive overview of the Guitar Scale Finder application architecture, designed to help AI agents quickly understand and contribute to the codebase.

## Project Overview

**Guitar Scale Finder** is an interactive web application for learning and practicing guitar scales. It visualizes scales on a virtual fretboard, plays them back with various instruments, and provides 20+ practice patterns for learning scales in any key.

**Tech Stack:**
- React 19 with TypeScript
- Vite (build tool)
- Zustand (state management)
- Tailwind CSS + Radix UI (styling & components)
- Framer Motion (animations)
- Web Audio API (sound generation)

## Architecture Overview

### Core Concepts

The application is built around these key concepts:

1. **Musical Theory**: Scales, keys, and tunings
2. **Fretboard Visualization**: Interactive guitar neck display
3. **Audio Playback**: Web Audio-based sound synthesis
4. **Phrase Generation**: Musical patterns for practice
5. **State Management**: Centralized application state

### Directory Structure

```
src/
├── components/           # React components
│   ├── Controls.tsx     # Main control panel UI
│   ├── guitar/          # Guitar-specific components
│   │   ├── Guitar.tsx   # Main fretboard component
│   │   ├── GuitarString.tsx
│   │   └── ScaleLegend.tsx
│   ├── common/          # Reusable components
│   └── ui/              # Radix UI components (select, slider, etc.)
├── audio.ts             # Web Audio synthesis engine
├── music.ts             # Music theory utilities
├── constants.ts         # Scales, tunings, tones definitions
├── phrases.ts           # Practice pattern generators
├── scheduler.ts         # Audio scheduling system
├── store.ts             # Zustand state management
└── App.tsx              # Main app component
```

## Core Systems

### 1. Music Theory System (`music.ts`, `constants.ts`)

**Key Concepts:**
- **Tones**: 12 chromatic notes (e, f, f#, g, g#, a, a#, b, c, c#, d, d#)
- **Scales**: Defined as arrays of semitone intervals
  - Example: `major: [2, 2, 1, 2, 2, 2, 1]` (W-W-H-W-W-W-H pattern)
- **Tunings**: String-to-note mappings for different guitar configurations
- **Absolute Semitones**: All notes referenced from E0 as origin (E4 = 0)

**Important Functions:**
```typescript
// music.ts
getNote(offset: number): Tone           // Convert offset to tone
getTones(scale, steps, key)             // Generate scale tones
getScalePitchClasses(scale)            // Get pitch classes within octave
getDegreeInScale(noteAbs, keyOffset, scale) // Get scale degree (1-7)
getNoteWithOctave(absFromE4)           // Format note with octave (e.g., "E4")
```

**Scale Definition Pattern:**
```typescript
// Scales are defined as intervals in semitones
const scales = {
  major: [2, 2, 1, 2, 2, 2, 1],  // Whole-Whole-Half-Whole-Whole-Whole-Half
  minor: [2, 1, 2, 2, 1, 2, 2],
  pentatonic: [3, 2, 2, 3, 2],
  // ... 20+ more scales
}
```

### 2. Audio System (`audio.ts`)

**Architecture:**
- **Web Audio API** for all sound generation
- **Synthesis Engine**: Oscillator-based sound synthesis
- **15 Sound Presets**: From simple sine waves to complex guitar timbres
- **Effects Chain**: Reverb, distortion, delay

**Key Components:**

```typescript
type SoundConfig = {
  layers: OscillatorLayer[];        // Multiple oscillators for rich sounds
  masterEnvelope: EnvelopeConfig;   // ADSR envelope
  filter?: FilterConfig;             // Optional filtering
  effects?: EffectConfig;            // Optional effects
}
```

**Sound Generation Flow:**
1. Convert semitone to frequency: `440 * 2^((semitone - 5) / 12)`
2. Create oscillators for each layer
3. Apply envelopes (ADSR)
4. Route through effects chain (filter → distortion → delay → reverb)
5. Connect to audio destination

**Main API:**
```typescript
playSemitone(semitoneFromE0, options?)     // Play note immediately
playSemitoneAt(semitoneFromE0, time, opts) // Schedule note at specific time
stopAllAudio()                              // Stop all playing notes
```

### 3. Phrase System (`phrases.ts`)

Generates note sequences for practice patterns. Each phrase mode creates a unique practice pattern.

**Pattern Categories:**
- **Basic**: `full-scale`, `snake`, `motif-1232`
- **Intervals**: `thirds`, `fourths`, `sixths`
- **Chords**: `triads`, `sevenths`, `power-chord`
- **Techniques**: `alternate-picking`, `sweep-arp`, `tremolo`
- **Metal**: `djent-palm`, `polyrhythm`, `breakdown-chug`, `legato-cascade`

**Core Function:**
```typescript
buildRelSequence(
  pcs: number[],        // Pitch classes (e.g., [0, 2, 4, 5, 7, 9, 11])
  mode: PhraseMode,     // Pattern type
  octaves: number,      // How many octaves to span
  withDesc: boolean     // Include descending pattern
): number[]             // Returns relative semitone sequence
```

**Pattern Example:**
```typescript
// 'thirds' pattern for major scale:
// Input:  pcs = [0, 2, 4, 5, 7, 9, 11]
// Output: [0,4, 2,5, 4,7, 5,9, 7,11, ...] (C-E, D-F, E-G, F-A, G-B, ...)
```

### 4. Scheduler System (`scheduler.ts`)

Manages synchronized audio playback and UI animations.

**Two Session Types:**

1. **Regular Session**: For interactive single notes
   ```typescript
   startSession(onUiNote: UiCallback): sessionId
   scheduleNoteAt(sessionId, semitone, whenSec, durSec, soundType)
   ```

2. **Optimized Session**: For phrase playback
   ```typescript
   startOptimizedSession(
     events: PlaybackEvent[],
     onUiNote: UiCallback,
     soundType: SoundType,
     trailLength: number,
     reduceAnimations: boolean
   ): sessionId
   ```

**Scheduling Strategy:**
- Audio scheduled immediately via Web Audio API (precise timing)
- UI updates via `requestAnimationFrame` (synced to display)
- 4ms epsilon for timing precision

### 5. State Management (`store.ts`)

Uses Zustand with persistence for all application state.

**State Structure:**
```typescript
type FormState = {
  // Scale settings
  scale: ScaleName;           // Which scale (major, minor, etc.)
  tone: Tone;                 // Root key (e, f, g, etc.)
  startOctave: number;        // Starting octave (0-9)

  // Instrument configuration
  tuningName: TuningName;     // Guitar tuning
  strings: number;            // Number of strings (1-100)
  frets: number;              // Number of frets (1-100)
  lowAtBottom: boolean;       // String orientation
  soundType: SoundType;       // Sound preset

  // Phrase settings
  phraseMode: PhraseMode;     // Practice pattern
  phraseOctaves: number;      // How many octaves (1-5)
  phraseDescend: boolean;     // Include descending
  phraseLoop: boolean;        // Loop playback
  oncePerTone: boolean;       // Play each tone once only

  // Playback settings
  bpm: number;                // Tempo (30-700)
  swing: boolean;             // Swing rhythm
  trailLength: number;        // Visual trail duration (ms)
  scheduleHorizon: number;    // Audio schedule lookahead (ms)

  // Visual settings
  highlightEnabled: boolean;
  legendOnly: boolean;
  octaveHighlight: boolean;
  minimalHighlight: boolean;
  reduceAnimations: boolean;
}
```

**Usage:**
```typescript
import { useFormStore, setFormState } from '@/store';

// In components
const bpm = useFormStore((s) => s.bpm);

// Update state
setFormState({ bpm: 120 });
```

### 6. Component Architecture

**Main Component Hierarchy:**
```
App.tsx
├── Controls.tsx           (Control panel at top)
│   ├── Scale section      (Scale, key, phrase settings)
│   ├── Instrument section (Tuning, strings, frets, sound)
│   └── Playback section   (BPM, trail, schedule horizon)
└── Guitar.tsx             (Main fretboard display)
    ├── GuitarString.tsx   (Individual strings with frets)
    └── ScaleLegend.tsx    (Note legend display)
```

**Key Props Flow:**

1. **App → Guitar:**
   ```typescript
   <Guitar
     playingAbs={number | null}      // Currently playing note
     playingSet={number[]}            // All active notes
     onPlayNote={(abs, dur) => void}  // Callback for note clicks
     stopAllPlayback={() => void}     // Stop button callback
     stopSignal={number}              // Increment to force stop
   />
   ```

2. **State → Controls:**
   - Controls reads from Zustand store
   - Updates via `setFormState()`
   - Calls `stopAllPlayback()` on most changes

## Common Tasks & Patterns

### Adding a New Scale

1. Add to `constants.ts`:
   ```typescript
   export const scales = {
     // ... existing scales
     "my-new-scale": [2, 1, 3, 1, 2, 2, 1], // intervals
   }
   ```

2. TypeScript will automatically update the `ScaleName` type
3. No UI changes needed - dropdown auto-populates

### Adding a New Phrase Pattern

1. Add mode to `constants.ts`:
   ```typescript
   export type PhraseMode =
     | "full-scale"
     | "my-new-pattern"; // Add here
   ```

2. Implement in `phrases.ts`:
   ```typescript
   if (mode === 'my-new-pattern') {
     const lastDeg = pcs.length;
     const degSeq: number[] = []; // Build your pattern
     // ... pattern logic
     const oneOct = degSeq.map((d) => pcs[d - 1]);
     return expandAcrossOctaves(oneOct, withDesc);
   }
   ```

3. Add to UI in `Controls.tsx`:
   ```tsx
   <SelectItem value="my-new-pattern">🎵 My Pattern</SelectItem>
   ```

### Adding a New Sound Preset

1. Define sound configuration in `audio.ts`:
   ```typescript
   const SOUND_PRESETS: Record<SoundType, SoundConfig> = {
     'my-sound': {
       layers: [
         { frequency: 1, type: 'sine', gain: 0.9 },
         { frequency: 2, type: 'triangle', gain: 0.4 }
       ],
       masterEnvelope: {
         attack: 0.01,
         attackLevel: 0.8,
         decay: 0.1,
         sustain: 0.6,
         release: 0.3
       },
       filter: {
         type: 'lowpass',
         frequency: 3,
         Q: 1.2
       }
     }
   }
   ```

2. Add to type in `audio.ts`:
   ```typescript
   export type SoundType =
     | 'marimba' | 'sine'
     | 'my-sound'; // Add here
   ```

3. Add to UI in `Controls.tsx` sound selector

### Debugging Audio Issues

**Common Issues:**
1. **Audio not playing**: Check browser autoplay policy - user interaction required
2. **Timing drift**: Verify `scheduleHorizon` and BPM calculations
3. **Clicks/pops**: Check envelope attack/release times (too short = clicks)
4. **Memory leaks**: Ensure `stopAllAudio()` disconnects all nodes

**Debug Tools:**
```typescript
// Check active audio context
import { getAudioContext } from '@/audio';
console.log(getAudioContext().state); // Should be 'running'

// Monitor scheduler sessions
import { scheduler } from '@/scheduler';
console.log(scheduler); // Inspect active sessions
```

### Performance Optimization

**Key Areas:**
1. **Audio**: Pre-schedule notes, avoid creating new contexts
2. **Rendering**: Use `React.memo()` for fretboard components
3. **State**: Use Zustand selectors to limit re-renders
4. **Animations**: Toggle `reduceAnimations` for low-end devices

**Optimization Flags:**
```typescript
reduceAnimations: boolean;    // Disable fancy animations
minimalHighlight: boolean;    // Minimal visual feedback
scheduleHorizon: number;      // Lower = less lookahead, less memory
```

## Important Constraints

### Musical Constraints
- **Note Range**: E0 to E9 (approximately 10 octaves)
- **Absolute Semitone Zero**: E4 (middle E on guitar) = 0
- **Timing**: All audio times in seconds relative to AudioContext time
- **Frequency Range**: 20Hz - 20kHz (filtered for playability)

### Technical Constraints
- **Browser Compatibility**: Requires Web Audio API support
- **Autoplay Policy**: First sound requires user interaction
- **Memory**: Large phrase sequences can be memory-intensive
- **Timing Precision**: 4ms window for UI sync (one frame at 240fps)

### UI Constraints
- **Responsive**: Mobile-first, desktop-optimized
- **Accessibility**: Proper labels, keyboard navigation
- **Performance**: Target 60fps for animations
- **State Persistence**: All settings saved to localStorage

## Testing

**Test Files:**
- `src/App.test.js` - App component tests
- `src/GuitarString.test.tsx` - String component tests
- `src/music.test.ts` - Music theory tests
- `src/phrases.test.ts` - Phrase generation tests

**Run Tests:**
```bash
yarn test           # Watch mode
yarn test:ui        # UI mode
yarn coverage       # Coverage report
```

## Common Pitfalls

1. **Octave Confusion**: E4 = 0 (not E0 = 0). Watch for octave offset calculations.

2. **State Updates**: Always use `setFormState()`, not direct Zustand set:
   ```typescript
   // ✅ Correct
   setFormState({ bpm: 120 });

   // ❌ Wrong
   useFormStore.setState({ bpm: 120 });
   ```

3. **Audio Scheduling**: Schedule audio BEFORE UI updates:
   ```typescript
   // ✅ Correct order
   playSemitoneAt(note, time, opts);
   flashPlaying(note, duration);

   // ❌ Wrong - UI might update before audio schedules
   flashPlaying(note, duration);
   playSemitoneAt(note, time, opts);
   ```

4. **Cleanup**: Always stop playback on state changes:
   ```typescript
   const handleChange = () => {
     stopAllPlayback();  // ✅ Always call first
     setFormState({ ... });
   }
   ```

5. **Scale Degree Indexing**: Scales use 1-based indexing in UI, 0-based in code:
   ```typescript
   // In phrase generation
   degSeq.push(1, 2, 3);  // 1-based degrees
   pcs[d - 1]             // Convert to 0-based index
   ```

## Useful Code Snippets

### Get Notes for Current Scale
```typescript
import { useFormStore } from '@/store';
import { scales } from '@/constants';
import { getScalePitchClasses, keyToOffset } from '@/music';

const scale = useFormStore(s => s.scale);
const tone = useFormStore(s => s.tone);
const startOctave = useFormStore(s => s.startOctave);

const intervals = scales[scale];
const pcs = getScalePitchClasses(intervals);
const keyOff = keyToOffset(tone);
const absoluteNotes = pcs.map(pc => pc + keyOff + (startOctave - 4) * 12);
```

### Play a Note Immediately
```typescript
import { playSemitone } from '@/audio';
import { useFormStore } from '@/store';

const soundType = useFormStore(s => s.soundType);
playSemitone(42, { duration: 1.0, type: soundType }); // Play F#4
```

### Schedule a Phrase
```typescript
import { scheduler } from '@/scheduler';
import { buildRelSequence } from '@/phrases';

const events = relativeSequence.map((rel, idx) => ({
  abs: keyOffset + rel + startOctave * 12,
  startTimeSec: getCurrentTime() + (idx * beatDuration),
  durSec: noteDuration
}));

const sessionId = scheduler.startOptimizedSession(
  events,
  onUiNote,
  soundType,
  trailLength,
  reduceAnimations
);
```

## Additional Resources

- **Web Audio API**: [MDN Web Audio Docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- **Music Theory**: Understanding intervals, scales, and degrees
- **React 19**: [React Docs](https://react.dev)
- **Zustand**: [Zustand GitHub](https://github.com/pmndrs/zustand)
- **TypeScript**: All code is fully typed

## Getting Help

When working with this codebase:

1. **Read the types**: TypeScript types are comprehensive and self-documenting
2. **Check the tests**: Test files show usage examples
3. **Console log**: Use browser DevTools to inspect audio context and state
4. **Refer to constants.ts**: Central source of truth for scales, tunings, and modes

## Contributing Guidelines

When adding new features:

1. **Maintain type safety**: Use TypeScript, no `any` types
2. **Follow patterns**: Match existing code structure and naming
3. **Test thoroughly**: Add tests for new functionality
4. **Update docs**: Keep this file updated with architectural changes
5. **Performance first**: Profile before optimizing, but keep performance in mind
6. **User experience**: All state changes should call `stopAllPlayback()` first

---

**Last Updated**: 2025-10-22
**Version**: 0.1.0
