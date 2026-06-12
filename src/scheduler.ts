/**
 * Audio scheduler — two separate concerns:
 *
 * 1. AUDIO scheduling: uses `setTimeout` to schedule Web Audio nodes only within a
 *    rolling SCHEDULE_AHEAD_SEC window. This keeps the AudioContext graph small and
 *    prevents glitching under heavy load (previously, all notes were scheduled at once).
 *
 * 2. UI callbacks (visual highlights): uses `requestAnimationFrame` and
 *    `AudioContext.currentTime` to fire exactly when the audio is playing,
 *    regardless of main-thread load.
 *
 * Based on Chris Wilson's "A Tale of Two Clocks" scheduling pattern.
 */
import { getCurrentTime, playSemitoneAt, SoundType } from './audio';
import {
  AUDIO_LOOKAHEAD_SEC,
  RAF_EPSILON_SEC,
  SCHEDULE_AHEAD_SEC,
  SCHEDULER_TICK_MS,
} from './constants';

/**
 * Events further than this many seconds in the past are skipped without scheduling.
 * Prevents a burst of stale audio when the tab resumes after being backgrounded.
 */
const STALE_THRESHOLD_SEC = 0.5;

export type PlaybackEvent = {
  abs: number;
  startTimeSec: number; // absolute AudioContext time
  durSec: number;
  /** Set when the event targets one specific fretboard location */
  stringIndex?: number;
  fret?: number;
};

type UiCallback = (absSemitone: number, durationMs: number, event?: PlaybackEvent) => void;

/** Phrase session — lookahead audio scheduling + rAF UI sync */
type PhraseSession = {
  id: number;
  events: PlaybackEvent[];
  nextScheduleIdx: number; // next event to schedule audio for
  nextUiIdx: number;       // next event to fire UI callback for
  /** When set, the event list repeats every this many seconds, indefinitely */
  loopDurationSec: number | null;
  scheduleCycle: number;   // loop iteration the audio scheduler is in
  uiCycle: number;         // loop iteration the UI callbacks are in
  onUiNote: UiCallback;
  soundType: SoundType;
  tickHandle: number | null;
  rafHandle: number | null;
};

/** Legacy single-note session (fret clicks, triggerNow) */
type Session = {
  id: number;
  onUiNote: UiCallback;
  uiEvents: { abs: number; durSec: number; timeSec: number }[];
  rafId: number | null;
};

class AudioScheduler {
  private nextId = 1;
  private sessions = new Map<number, Session>();
  private phraseSessions = new Map<number, PhraseSession>();

  // ─── Phrase playback ──────────────────────────────────────────────────────

  /**
   * Start a phrase session. Audio is scheduled in rolling SCHEDULE_AHEAD_SEC windows
   * via setTimeout — never all at once. UI callbacks fire from rAF when
   * AudioContext.currentTime reaches each event's scheduled time.
   *
   * @param events  Array of events with *absolute* AudioContext startTimeSec values.
   */
  startPhraseSession(
    events: PlaybackEvent[],
    onUiNote: UiCallback,
    soundType: SoundType,
    loopDurationSec?: number,
  ): number {
    const id = this.nextId++;
    const session: PhraseSession = {
      id,
      events,
      nextScheduleIdx: 0,
      nextUiIdx: 0,
      // Guard against zero-length loops spinning the scheduler
      loopDurationSec: loopDurationSec && loopDurationSec > 0.05 ? loopDurationSec : null,
      scheduleCycle: 0,
      uiCycle: 0,
      onUiNote,
      soundType,
      tickHandle: null,
      rafHandle: null,
    };
    this.phraseSessions.set(id, session);
    this._audioTick(session);
    this._uiRaf(session);
    return id;
  }

  /**
   * Schedule audio nodes for all events within [now, now + SCHEDULE_AHEAD_SEC].
   * Reschedules itself via setTimeout until all events are covered.
   */
  private _audioTick(session: PhraseSession): void {
    const now = getCurrentTime();
    const until = now + SCHEDULE_AHEAD_SEC;

    for (;;) {
      if (session.nextScheduleIdx >= session.events.length) {
        if (session.loopDurationSec == null) break;
        // Wrap into the next loop iteration; event times shift by one period
        session.nextScheduleIdx = 0;
        session.scheduleCycle += 1;
      }
      const evt = session.events[session.nextScheduleIdx];
      const startTimeSec =
        evt.startTimeSec + session.scheduleCycle * (session.loopDurationSec ?? 0);
      if (startTimeSec > until) break;
      session.nextScheduleIdx++;

      // Skip events that are too far in the past — avoids a burst of stale audio
      // when the tab was backgrounded and setTimeout ticks fire late.
      if (startTimeSec < now - STALE_THRESHOLD_SEC) continue;

      // One failed note must not break the tick chain and silence the session
      try {
        playSemitoneAt(evt.abs, startTimeSec, {
          duration: Math.max(0.2, evt.durSec),
          type: session.soundType,
        });
      } catch (error) {
        console.error('Failed to schedule note:', error);
      }
    }

    if (session.loopDurationSec != null || session.nextScheduleIdx < session.events.length) {
      session.tickHandle = window.setTimeout(
        () => this._audioTick(session),
        SCHEDULER_TICK_MS,
      ) as unknown as number;
    } else {
      session.tickHandle = null;
    }
  }

  /**
   * Fire UI callbacks when AudioContext.currentTime reaches each event's scheduled
   * time (within RAF_EPSILON_SEC tolerance). Runs on requestAnimationFrame so visual
   * updates are always in sync with the display refresh.
   */
  private _uiRaf(session: PhraseSession): void {
    const now = getCurrentTime();

    for (;;) {
      if (session.nextUiIdx >= session.events.length) {
        if (session.loopDurationSec == null) break;
        session.nextUiIdx = 0;
        session.uiCycle += 1;
      }
      const evt = session.events[session.nextUiIdx];
      const startTimeSec =
        evt.startTimeSec + session.uiCycle * (session.loopDurationSec ?? 0);
      if (startTimeSec > now + RAF_EPSILON_SEC) break;
      try { session.onUiNote(evt.abs, Math.round(evt.durSec * 1000), evt); } catch { /* noop */ }
      session.nextUiIdx++;
    }

    if (session.loopDurationSec != null || session.nextUiIdx < session.events.length) {
      session.rafHandle = requestAnimationFrame(
        () => this._uiRaf(session),
      ) as unknown as number;
    } else {
      session.rafHandle = null;
    }
  }

  // ─── Single-note (legacy) ─────────────────────────────────────────────────

  startSession(onUiNote: UiCallback): number {
    const id = this.nextId++;
    const session: Session = { id, onUiNote, uiEvents: [], rafId: null };
    this.sessions.set(id, session);
    return id;
  }

  /** Schedule a note at an absolute AudioContext time and register a UI event. */
  scheduleNoteAt(
    sessionId: number,
    absSemitone: number,
    whenSec: number,
    durSec: number,
    soundType: SoundType,
  ): void {
    playSemitoneAt(absSemitone, whenSec, { duration: Math.max(0.2, durSec), type: soundType });
    const s = this.sessions.get(sessionId);
    if (!s) return;
    s.uiEvents.push({ abs: absSemitone, durSec, timeSec: whenSec });
    this._ensureLegacyRaf(s);
  }

  /** Convenience: schedule a single note immediately with a small lookahead. */
  triggerNow(
    absSemitone: number,
    durationMs: number,
    soundType: SoundType,
    onUiNote: UiCallback,
  ): void {
    const sid = this.startSession((abs, dur) => {
      onUiNote(abs, dur);
      this.stopSession(sid);
    });
    const start = getCurrentTime() + AUDIO_LOOKAHEAD_SEC;
    const durSec = Math.max(0.05, durationMs / 1000);
    this.scheduleNoteAt(sid, absSemitone, start, durSec, soundType);
  }

  private _ensureLegacyRaf(s: Session): void {
    if (s.rafId != null) return;
    const step = () => {
      const now = getCurrentTime();
      while (s.uiEvents.length && now + RAF_EPSILON_SEC >= s.uiEvents[0].timeSec) {
        const evt = s.uiEvents.shift()!;
        try { s.onUiNote(evt.abs, Math.round(evt.durSec * 1000)); } catch { /* noop */ }
      }
      if (s.uiEvents.length === 0) { s.rafId = null as unknown as number; return; }
      s.rafId = requestAnimationFrame(step) as unknown as number;
    };
    s.rafId = requestAnimationFrame(step) as unknown as number;
  }

  // ─── Session management ───────────────────────────────────────────────────

  stopSession(id: number): void {
    const s = this.sessions.get(id);
    if (s) {
      if (s.rafId != null) { try { cancelAnimationFrame(s.rafId); } catch { /* noop */ } s.rafId = null; }
      this.sessions.delete(id);
      return;
    }

    const ps = this.phraseSessions.get(id);
    if (ps) {
      if (ps.tickHandle != null) { clearTimeout(ps.tickHandle); ps.tickHandle = null; }
      if (ps.rafHandle != null) { try { cancelAnimationFrame(ps.rafHandle); } catch { /* noop */ } ps.rafHandle = null; }
      this.phraseSessions.delete(id);
    }
  }

  stopAll(): void {
    [...this.sessions.keys()].forEach((id) => this.stopSession(id));
    [...this.phraseSessions.keys()].forEach((id) => this.stopSession(id));
  }
}

export const scheduler = new AudioScheduler();
