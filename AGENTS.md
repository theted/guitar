# AGENTS.md — Guitar Scale Finder

Orientation for agents working in this codebase. It describes what the code
does today; if you change the architecture, update this file in the same commit.

## Project overview

An interactive fretboard for learning scales: pick a key and a scale, see it on
a configurable neck, hear phrases played back on it, and practise position
boxes and diatonic chords.

**Stack:** React 19 · TypeScript · Vite · Zustand (persisted) · Tailwind CSS 4 ·
Radix UI (select only) · Web Audio API. Animations are hand-rolled with the Web
Animations API — there is no animation library.

**Commands**

```bash
npm start          # dev server on http://localhost:5173
npm run build      # tsc -noEmit && vite build
npm run test       # vitest, watch mode
npm run test:run   # vitest, single run
npm run coverage   # vitest run --coverage
npm run lint       # eslint src
```

`@/` is a path alias for `src/` (see `vite.config.ts` and `tsconfig.json`).
Nearly every import uses it.

## Directory structure

```
src/
├── App.tsx                     # Layout, audio warm-up, global effects
├── store.ts                    # Zustand store + persistence migrations
├── scheduler.ts                # Audio scheduling + rAF UI sync
├── phrases.ts                  # Phrase pattern generators
├── music.ts                    # keyToOffset, getScalePitchClasses
├── audio/
│   ├── index.ts                # playSemitoneAt + re-exports
│   ├── context.ts              # AudioContext, master bus, voice registry
│   ├── synthesis.ts            # Voice construction (oscillators, envelopes, FX chain)
│   ├── effects.ts              # Reverb / distortion / delay nodes (cached)
│   └── presets.ts              # SoundType and the 15 sound configs
├── theory/
│   ├── pitch.ts                # mod12, relativeTo — the pitch-class primitives
│   ├── spelling.ts             # Enharmonic spelling (Bb vs A#) per key
│   ├── intervals.ts            # Interval names (P1, m3, …)
│   ├── chords.ts               # Diatonic chords for heptatonic scales
│   └── positions.ts            # String base notes, fretboard range, position boxes
├── constants/
│   ├── scales.ts  tones.ts  tunings.ts  phrases.ts   # catalogs + UI groupings
│   ├── defaults.ts  scheduler.ts  animation.ts
│   └── index.ts                # the import surface: `from "@/constants"`
├── hooks/
│   ├── usePlayback.ts          # Playback orchestration (owns the phrase)
│   ├── useKeyboardShortcuts.ts # Space / Escape / arrow keys
│   └── useApplySetting.ts      # Settings change that interrupts playback
├── components/
│   ├── Header.tsx              # Key row, title (= scale picker), scale legend
│   ├── Transport.tsx           # Bottom bar: play, pattern, octaves, tempo, sound, volume
│   ├── controls/               # Settings drawer (SetupControls) + shared option lists
│   ├── guitar/                 # The neck, its toolbar and the phrase strip
│   │   ├── geometry.ts         # Fret spacing and inlay positions
│   │   └── hooks/              # Fretboard geometry + phrase event hooks
│   └── ui/                     # Picker (Radix select), segmented, stepper, switch, slider
├── lib/tone-animation.ts       # Flash registry (frets, legend, phrase steps)
├── lib/notation.ts             # pretty(): "Bb" → "B♭" for display only
├── types/music.ts              # Branded number types
└── integration/                # Cross-module tests
```

## Core systems

### 1. Pitch conventions

- **Pitch classes are E-rooted**: `e=0, f=1, f#=2, g=3, g#=4, a=5, a#=6, b=7,
  c=8, c#=9, d=10, d#=11` (`constants/tones.ts`). This matches the open low-E
  string and is the convention everywhere except `theory/spelling.ts`, which
  converts to C-rooted internally.
- **Absolute semitones are measured from E4 = 0**. Notes below it are negative
  and completely ordinary — standard tuning at start octave 4 puts the low E at
  `-24`. Never use bare `% 12` on an absolute semitone; use `mod12` from
  `theory/pitch.ts`.
- **Scales are interval arrays**: `major: [2,2,1,2,2,2,1]`.
  `getScalePitchClasses` turns those into cumulative pitch classes
  `[0,2,4,5,7,9,11]`, relative to the tonic.
- **Degrees are 1-based in the UI, 0-based in arrays**: `pcs[degree - 1]`.

### 2. Fretboard geometry (`theory/positions.ts`, `hooks/useFretboard.ts`)

`getStringBaseNotes(tuning, strings, startOctave)` returns the open-string
pitches **low string first**. The highest string anchors at the start octave and
each lower string is placed in the octave below its neighbour, so the result is
always sorted ascending — a contract the renderer and the position engine rely
on.

`useFretboard()` is the single source of the on-screen neck: `baseNotes`,
`frets`, `lowest`, `highest`. Anything that must agree with what the user sees
reads it from there rather than recomputing from the store.

`getScalePositions` builds the classic box positions: every scale note inside a
fixed fret window, anchored on each scale tone of the lowest string.

### 3. Phrases (`phrases.ts`)

`modeBuilders` is an exhaustive `Record<PhraseMode, OctBuilder>`; each builder
returns one octave of **relative** semitones and `buildRelSequence` expands it
across octaves (plus the descent).

Two functions place that abstract shape onto the actual neck:

- `getPhraseRootAbs(keyOffset, lowestAbs)` — the lowest tonic that exists on the
  neck. Phrases are offsets from this, so they follow the tuning and start
  octave instead of being pinned to E4.
- `getPlayableOctaves(pcs, mode, requested, withDesc, rootAbs, highestAbs)` —
  the largest span whose top note is still under the top fret. It measures the
  generated sequence rather than assuming `octaves × 12`, because some modes
  (`sixths`) reach above their octave.

Adding a mode: add it to the `PhraseMode` union **and** to
`PHRASE_MODE_GROUPS` in `constants/phrases.ts` (a mode missing from the groups
is unreachable in the UI), then add a builder to `modeBuilders`. The exhaustive
`Record` makes a missing builder a type error. `constants/groups.test.ts` guards
the catalog/grouping correspondence.

### 4. Audio (`audio/`)

```
oscillators → layer gains → [filter] → [distortion] → [delay] → [reverb] → voice gain → master bus → destination
```

- `playSemitoneAt(semitone, atTime, { duration, type })` is the only entry point.
- Every voice connects to the **master bus** (`getMasterBus()`), not to
  `destination`, so `setMasterVolume(0–1)` affects sounding notes and costs
  nothing per note.
- Voice stealing per pitch plus a hard `MAX_POLYPHONY` cap keep the node graph
  bounded. Reverb impulses and distortion curves are cached — generating them
  per note was measurably expensive.
- Frequency: `440 * 2^((semitone - 5) / 12)` (A4 is 5 semitones above E4).
- Envelope ramps are exponential and never target zero or a negative time; a
  negative release time used to throw and silence the first playback entirely.

Adding a sound: add the key to `SoundType` and a config to `SOUND_PRESETS`
(both in `audio/presets.ts`), then add it to `SOUND_GROUPS` in
`components/controls/options.ts`.

### 5. Scheduler (`scheduler.ts`)

Chris Wilson's "two clocks" pattern, with one public entry point per use case:

```ts
scheduler.startPhraseSession(events, onUiNote, soundType, loopDurationSec?) // → sessionId
scheduler.triggerNow(abs, durationMs, soundType, onUiNote)                  // fret clicks
scheduler.stopSession(id) / scheduler.stopAll()
```

- Audio nodes are created only for events inside a rolling
  `SCHEDULE_AHEAD_SEC` (150 ms) window, refilled by a `setTimeout` tick — never
  all at once.
- UI callbacks fire from `requestAnimationFrame` when
  `AudioContext.currentTime` reaches each event's time, so highlights stay in
  sync under load. Events more than `STALE_THRESHOLD_SEC` in the past are
  skipped, which prevents an audio burst when a backgrounded tab resumes.
- Looping repeats the event list natively (`loopDurationSec`) rather than
  pre-generating repeats.

`PlaybackEvent` carries `index` (position in the sequence) and optionally
`stringIndex`/`fret` when the event targets one specific fret.

### 6. Highlighting (`lib/tone-animation.ts`)

Elements register themselves once and are flashed by lookup — no DOM queries or
class toggling per note. Three registries:

| Register | Flash | Used by |
|---|---|---|
| `applyToneClass(el, abs, { fret })` | `flashTone(abs)` / `flashAt(string, fret)` | frets |
| `applyToneClass(el, abs, { anyOctave: true })` | `flashTone(abs)` in either mode | scale legend |
| `registerStep(el, index)` | `flashStep(index)` | phrase strip |

Modes: `pitch-class` (default) flashes every octave of a note;
`octave-specific` flashes only the exact pitch. `anyOctave` elements opt out of
that restriction — the legend shows degrees, not pitches, so it lights up
whichever octave is playing. Every registered element needs a
`<span className="tone-overlay" />` child; that's what animates.

### 7. State (`store.ts`)

One persisted Zustand store. Read with selectors (`useShallow` for objects),
write with `setFormState`, or with `useApplySetting(stopAllPlayback)` when the
change invalidates what is currently playing (scale, key, tuning, phrase shape).
Settings that apply cleanly mid-phrase — volume, mute, visual toggles — should
call `setFormState` directly and *not* interrupt playback.

Persistence is versioned (currently 5). `migrateFormState` keeps only fields
that still exist in `initial`, so settings dropped in a past version don't
linger in localStorage, and maps renamed fields via `RENAMED_FIELDS`. Add to
both when you rename or remove a setting, and bump the version.

## Component tree

```
App
├── Header                    what: key row · title/scale picker · ScaleLegend (flashes)
├── Guitar                    how it's shown
│   ├── ChordStrip            diatonic chords (heptatonic scales only)
│   ├── PositionStrip         position boxes
│   ├── label mode            notes / degrees / intervals
│   ├── GuitarNeck → Board + GuitarString → StringFret
│   ├── FretMarkers           fret numbers
│   └── PhraseStrip           the phrase note by note, follows playback
├── Transport                 play: play/pause · pattern · octaves · tempo · sound · volume
└── ControlsPanel (drawer)
    └── SetupControls         instrument · positions · display · keyboard
```

`usePlayback()` lives in `App` and owns everything about playback: the phrase
events, the player session, note flashes and the global stop signal. It hands
`playNote` and `events` down to `Guitar`.

## Performance notes

The fretboard renders ~150 fret elements. What keeps it smooth:

- `React.memo` on `StringFret`, `GuitarString`, `GuitarNeck`, `PhraseStep`, with
  memoized descriptors so unrelated store changes skip them entirely.
- Flashes go through the animation registry, never through React state — no
  component re-renders during playback.
- `playNote` reads trail settings via `useFormStore.getState()` at call time so
  the callback identity stays stable; otherwise dragging the trail slider would
  re-render the whole fretboard.
- `contain` and `translateZ(0)` on the containers (`index.css`).
- Each fret's look is a `data-state` attribute (`root`, `scale`, `chord`,
  `chord-root`, `muted`, `off`) styled in `index.css`, not a class string.

## Visual system

Tokens live at the top of `index.css` and are exposed to Tailwind through
`@theme inline` (so utilities resolve them where they're used). `.inverse`
re-maps the same tokens for the dark transport bar; components never need to
know they're inside it. Colour is information: amber is the tonic, teal a
chord tone, bone any other scale tone. Keep it that way. Type is Archivo; its
width axis (`.type-title`, `.type-wide`) stands in for a second typeface.

The neck is drawn from `guitar/geometry.ts`: `neckColumns` gives the board, the
strings and the fret numbers the same grid, with frets narrowing towards the
body. Wood, nut, wires and inlays are a single `Board` layer behind the strings.

## Testing

22 test files, ~260 tests, all under `src/` next to what they test, plus
`src/integration/` for cross-module behaviour. `vitest` + Testing Library +
jsdom. `setupTests.ts` swaps in an in-memory `localStorage` when Node's own
(Node 22+, empty without `--localstorage-file`) shadows jsdom's. jsdom has no
Web Audio and no Web Animations API — audio and animation
tests mock `Element.prototype.animate` and the `./audio` module.

Prefer exact expected values over shape assertions: the spec tables in
`theory/positions.test.ts` and `phrases.test.ts` are the pattern to follow.

## Pitfalls

1. **E4 = 0, not E0.** Absolute semitones go negative below it.
2. **Never bare `% 12`** on an absolute semitone — use `mod12`/`relativeTo`.
3. **Phrases are anchored to the neck**, not to the key offset. If you build
   note positions from a key, run them through `getPhraseRootAbs` first.
4. **`getStringBaseNotes` returns low string first**; render order (which can be
   flipped by `lowAtBottom`) is a separate concern handled by
   `useRenderedStrings`.
5. **Adding a catalog entry means two places**: the catalog and its UI grouping.
6. **Don't add a store field without a control that reads it** — three settings
   in this codebase were persisted and adjustable but wired to nothing.
