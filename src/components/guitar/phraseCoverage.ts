import { mod12 } from "@/theory/pitch";
import type { FlashMode } from "@/store";
import type { PhraseEvent } from "./hooks/usePhraseEvents";

/** Which way through the phrase a fret is played */
export type PlayedOn = "up" | "down" | "both";

/**
 * Where a phrase turns: its first note farthest from the note it starts on —
 * the top of a run up, the bottom of "Sequence down", the last note of a
 * phrase that never comes back. The way up is events[0..turn] and the way
 * down events[turn..]; the turning note belongs to both.
 */
export const phraseTurn = (events: readonly PhraseEvent[]): number => {
  if (events.length === 0) return 0;
  const start = events[0].abs;
  let turn = 0;
  events.forEach((event, index) => {
    if (Math.abs(event.abs - start) > Math.abs(events[turn].abs - start)) turn = index;
  });
  return turn;
};

/**
 * The frets a phrase lights, per low-based string, and which way through it:
 * exactly what playback flashes (see playNote). An event with a fret location
 * lights that fret; any other lights its pitch wherever it is, or with
 * `flashMode` "all" every octave of it. Null for an empty phrase, which has
 * nothing to fade.
 */
export const phraseCoverage = (
  events: readonly PhraseEvent[],
  flashMode: FlashMode,
  baseNotes: readonly number[],
  frets: number
): Array<Map<number, PlayedOn>> | null => {
  if (events.length === 0) return null;
  const turn = phraseTurn(events);
  const byString = baseNotes.map(() => new Map<number, PlayedOn>());
  const mark = (stringIndex: number, fret: number, way: "up" | "down") => {
    const played = byString[stringIndex];
    if (!played) return;
    const before = played.get(fret);
    played.set(fret, before && before !== way ? "both" : way);
  };

  // Pitches played without a location light up by pitch (or pitch class)
  const pitchKey = (abs: number) => (flashMode === "all" ? mod12(abs) : abs);
  const byPitch = { up: new Set<number>(), down: new Set<number>() };
  const add = (event: PhraseEvent, way: "up" | "down") => {
    if (event.stringIndex !== undefined && event.fret !== undefined) {
      mark(event.stringIndex, event.fret, way);
    } else {
      byPitch[way].add(pitchKey(event.abs));
    }
  };
  events.forEach((event, index) => {
    if (index <= turn) add(event, "up");
    if (index >= turn) add(event, "down");
  });

  if (byPitch.up.size > 0 || byPitch.down.size > 0) {
    baseNotes.forEach((open, stringIndex) => {
      for (let fret = 0; fret <= frets; fret += 1) {
        const key = pitchKey(open + fret);
        if (byPitch.up.has(key)) mark(stringIndex, fret, "up");
        if (byPitch.down.has(key)) mark(stringIndex, fret, "down");
      }
    });
  }
  return byString;
};
