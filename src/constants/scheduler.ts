/** How far ahead (in seconds) to schedule audio events for stable playback start */
export const AUDIO_LOOKAHEAD_SEC = 0.03;

/** RAF epsilon (seconds) — events within this window are considered "now" (~4 ms) */
export const RAF_EPSILON_SEC = 0.004;

/** Ramp-down time (seconds) when force-stopping a voice */
export const VOICE_STOP_RAMP_SEC = 0.03;

/** Extra buffer (ms) added to cleanup timer so voices can finish their release tail */
export const VOICE_CLEANUP_EXTRA_MS = 200;

/** Minimum stop time (seconds) after current time to avoid scheduling glitches */
export const VOICE_MIN_STOP_SEC = 0.01;
