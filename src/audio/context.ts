export type ActiveVoice = {
  stop: (time?: number) => void;
};

export const activeVoices = new Set<ActiveVoice>();

let audioCtx: AudioContext | null = null;
let isAudioInitialized = false;

const initializeAudio = async (): Promise<AudioContext> => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext!)();
    try {
      audioCtx.resume();
    } catch {}
  } else {
    try {
      audioCtx.resume();
    } catch {}
  }

  if (audioCtx.state === "suspended") {
    try {
      await audioCtx.resume();
      isAudioInitialized = true;
    } catch (error) {
      console.warn("AudioContext resume failed:", error);
      throw error;
    }
  } else {
    isAudioInitialized = true;
  }

  return audioCtx;
};

export const getAudioContext = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext!)();
  }

  if (!isAudioInitialized && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {
      console.warn("AudioContext resume failed - user interaction may be required");
    });
  }

  return audioCtx;
};

export const ensureAudioInitialized = async (): Promise<void> => {
  try {
    await initializeAudio();
  } catch (error) {
    console.error("Failed to initialize audio:", error);
    throw error;
  }
};

export const getCurrentTime = (): number => getAudioContext().currentTime;

export const stopAllAudio = () => {
  const now = getCurrentTime();
  Array.from(activeVoices).forEach((voice) => {
    try {
      voice.stop(now);
    } catch {}
  });
};
