import { getCurrentTime, playSemitoneAt, SoundType } from './audio';

type UiCallback = (absSemitone: number, durationMs: number) => void;

type UiEvent = { abs: number; durSec: number; timeSec: number };

type Session = {
  id: number;
  onUiNote: UiCallback;
  uiEvents: UiEvent[];
  rafId: number | null;
};

type PlaybackEvent = {
  abs: number;
  startTimeSec: number;
  durSec: number;
};

type OptimizedSession = {
  id: number;
  events: PlaybackEvent[];
  elementRefs: Map<number, HTMLElement[]>;
  chipRefs: Map<number, HTMLElement[]>;
  onUiNote: UiCallback;
  rafId: number | null;
  soundType: SoundType;
  trailLength: number;
  reduceAnimations: boolean;
};

class AudioScheduler {
  private nextId = 1;
  private sessions = new Map<number, Session>();
  private optimizedSessions = new Map<number, OptimizedSession>();

  startSession(onUiNote: UiCallback): number {
    const id = this.nextId++;
    const session: Session = { id, onUiNote, uiEvents: [], rafId: null };
    this.sessions.set(id, session);
    this.ensureRaf(session);
    return id;
  }

  // New optimized session for pre-computed sequences
  startOptimizedSession(
    events: PlaybackEvent[],
    onUiNote: UiCallback,
    soundType: SoundType,
    trailLength: number,
    reduceAnimations: boolean = false
  ): number {
    const id = this.nextId++;
    
    // Pre-cache DOM element references
    const elementRefs = new Map<number, HTMLElement[]>();
    const chipRefs = new Map<number, HTMLElement[]>();
    
    events.forEach(event => {
      // Cache fretboard elements
      if (!elementRefs.has(event.abs)) {
        const els = Array.from(document.querySelectorAll(`[data-abs='${event.abs}'] .note-overlay-wa`)) as HTMLElement[];
        elementRefs.set(event.abs, els);
      }
      
      // Cache scale legend elements  
      const pc = ((event.abs % 12) + 12) % 12;
      if (!chipRefs.has(pc)) {
        const chipEls = Array.from(document.querySelectorAll(`[data-pc='${pc}'] .note-overlay-wa`)) as HTMLElement[];
        chipRefs.set(pc, chipEls);
      }
    });
    
    const session: OptimizedSession = { 
      id, 
      events, 
      elementRefs, 
      chipRefs, 
      onUiNote, 
      rafId: null, 
      soundType, 
      trailLength,
      reduceAnimations
    };
    
    this.optimizedSessions.set(id, session);
    
    // Schedule all audio events immediately
    events.forEach(event => {
      playSemitoneAt(event.abs, event.startTimeSec, { 
        duration: Math.max(0.2, event.durSec), 
        type: soundType 
      });
    });
    
    this.ensureOptimizedRaf(session);
    return id;
  }

  stopSession(id: number) {
    const s = this.sessions.get(id);
    if (s) {
      if (s.rafId != null) {
        try { cancelAnimationFrame(s.rafId); } catch {}
        s.rafId = null;
      }
      this.sessions.delete(id);
      return;
    }
    
    const os = this.optimizedSessions.get(id);
    if (os) {
      if (os.rafId != null) {
        try { cancelAnimationFrame(os.rafId); } catch {}
        os.rafId = null;
      }
      this.optimizedSessions.delete(id);
    }
  }

  stopAll() {
    Array.from(this.sessions.keys()).forEach((id) => this.stopSession(id));
    Array.from(this.optimizedSessions.keys()).forEach((id) => this.stopSession(id));
  }

  // Schedule a note at an absolute AudioContext time (seconds)
  scheduleNoteAt(sessionId: number, absSemitone: number, whenSec: number, durSec: number, soundType: SoundType) {
    playSemitoneAt(absSemitone, whenSec, { duration: Math.max(0.2, durSec), type: soundType });
    const s = this.sessions.get(sessionId);
    if (!s) return;
    s.uiEvents.push({ abs: absSemitone, durSec, timeSec: whenSec });
    this.ensureRaf(s);
  }

  // Convenience: schedule immediately with a small safety lookahead and a one-off UI callback
  triggerNow(absSemitone: number, durationMs: number, soundType: SoundType, onUiNote: UiCallback) {
    const sid = this.startSession((abs, dur) => {
      onUiNote(abs, dur);
      // auto-stop after first dispatch
      this.stopSession(sid);
    });
    const start = getCurrentTime() + 0.03; // slight lookahead for stable start
    const durSec = Math.max(0.05, durationMs / 1000);
    this.scheduleNoteAt(sid, absSemitone, start, durSec, soundType);
  }

  private ensureRaf(s: Session) {
    if (s.rafId != null) return;
    const step = () => {
      const now = getCurrentTime();
      const epsilon = 0.004; // ~4ms
      while (s.uiEvents.length && now + epsilon >= s.uiEvents[0].timeSec) {
        const evt = s.uiEvents.shift()!;
        try { s.onUiNote(evt.abs, Math.round(evt.durSec * 1000)); } catch {}
      }
      if (s.uiEvents.length === 0) {
        // No pending events — stop RAF until new ones arrive
        s.rafId = null as unknown as number;
        return;
      }
      s.rafId = requestAnimationFrame(step) as unknown as number;
    };
    s.rafId = requestAnimationFrame(step) as unknown as number;
  }

  private ensureOptimizedRaf(s: OptimizedSession) {
    if (s.rafId != null) return;
    
    let eventIndex = 0;
    
    const step = () => {
      const now = getCurrentTime();
      const epsilon = 0.004; // ~4ms precision
      
      // Process all events that should trigger now
      while (eventIndex < s.events.length && now + epsilon >= s.events[eventIndex].startTimeSec) {
        const event = s.events[eventIndex];
        
        // Trigger UI callback
        try { 
          s.onUiNote(event.abs, Math.round(event.durSec * 1000)); 
        } catch {}
        
        // Trigger optimized animations
        if (!s.reduceAnimations) {
          const fretElements = s.elementRefs.get(event.abs) || [];
          const pc = ((event.abs % 12) + 12) % 12;
          const chipElements = s.chipRefs.get(pc) || [];
          
          [...fretElements, ...chipElements].forEach(el => {
            try {
              el.animate([{ opacity: 0.9 }, { opacity: 0 }], { 
                duration: s.trailLength, 
                easing: 'linear' 
              });
            } catch {}
          });
        }
        
        eventIndex++;
      }
      
      if (eventIndex >= s.events.length) {
        // All events processed
        s.rafId = null;
        return;
      }
      
      s.rafId = requestAnimationFrame(step) as unknown as number;
    };
    
    s.rafId = requestAnimationFrame(step) as unknown as number;
  }
}

export const scheduler = new AudioScheduler();

