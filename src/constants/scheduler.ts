/** How far ahead (in seconds) to schedule audio events for stable playback start */
export const AUDIO_LOOKAHEAD_SEC = 0.03;

/** RAF epsilon (seconds) — events within this window are considered "now" (~4 ms) */
export const RAF_EPSILON_SEC = 0.004;

/**
 * Lookahead window (seconds) for the phrase audio scheduler.
 * Audio nodes are created only for events within this window, keeping the Web Audio
 * graph small at any point in time. 150 ms provides ~9 RAF frames of buffer.
 */
export const SCHEDULE_AHEAD_SEC = 0.15;

/** How often (ms) the phrase scheduler's setTimeout tick fires to queue upcoming audio. */
export const SCHEDULER_TICK_MS = 25;

/** Ramp-down time (seconds) when force-stopping a voice */
export const VOICE_STOP_RAMP_SEC = 0.03;

/** Extra buffer (ms) added to cleanup timer so voices can finish their release tail */
export const VOICE_CLEANUP_EXTRA_MS = 200;

/** Minimum stop time (seconds) after current time to avoid scheduling glitches */
export const VOICE_MIN_STOP_SEC = 0.01;
