import React from 'react';
import { Settings } from 'lucide-react';
import Guitar from '@/components/guitar/Guitar';
import ControlsPanel from '@/components/controls/ControlsPanel';
import { useFormStore } from '@/store';
import { toneAnimationManager } from '@/lib/tone-animation';
import { scheduler } from '@/scheduler';
import { stopAllAudio } from '@/audio';

const App: React.FC = () => {
  const [panelOpen, setPanelOpen] = React.useState(false);

  const trailLength = useFormStore((s) => s.trailLength);
  const minimalHighlight = useFormStore((s) => s.minimalHighlight);
  const octaveHighlight = useFormStore((s) => s.octaveHighlight);

  React.useEffect(() => {
    toneAnimationManager.setMode(octaveHighlight ? 'octave-specific' : 'pitch-class');
  }, [octaveHighlight]);

  const playingTimersRef = React.useRef<Record<number, number>>({});
  const [stopSignal, setStopSignal] = React.useState(0);

  const stopAllPlayback = React.useCallback(() => {
    scheduler.stopAll();
    stopAllAudio();
    Object.values(playingTimersRef.current).forEach((tid) => {
      try { window.clearTimeout(tid); } catch {}
    });
    playingTimersRef.current = {};
    toneAnimationManager.stopAll();
    setStopSignal((cur) => cur + 1);
  }, []);

  const playNote = React.useCallback((absSemitone: number, durationMs = 200, _source: 'fretboard' | 'phrase' = 'fretboard') => {
    const trailMs = Math.max(trailLength, durationMs);
    const existing = playingTimersRef.current[absSemitone];
    if (existing) window.clearTimeout(existing);
    toneAnimationManager.flashTone(absSemitone, minimalHighlight ? durationMs : trailMs, 'octave-specific');
    const tid = window.setTimeout(() => {
      delete playingTimersRef.current[absSemitone];
    }, minimalHighlight ? durationMs : trailMs);
    playingTimersRef.current[absSemitone] = tid as unknown as number;
  }, [trailLength, minimalHighlight]);

  return (
    <div className="app-content min-h-screen w-full">
      <div className="app-bg" />

      {/* Slim top bar */}
      <header className="fixed top-0 left-0 right-0 z-30 h-12 flex items-center justify-between px-4 border-b border-white/[0.06] bg-black/60 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-white/90 text-sm font-semibold tracking-wide">Guitar Scale Finder</span>
        </div>
        <button
          onClick={() => setPanelOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/50 hover:text-white/90 hover:bg-white/[0.06] transition-all text-xs uppercase tracking-widest font-medium"
          aria-label="Open settings"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
      </header>

      {/* Guitar — only 48px top offset now */}
      <main className="fixed inset-0 flex items-center justify-center px-4 pt-12">
        <Guitar
          onPlayNote={playNote}
          stopAllPlayback={stopAllPlayback}
          stopSignal={stopSignal}
        />
      </main>

      <ControlsPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        stopAllPlayback={stopAllPlayback}
      />
    </div>
  );
};

export default App;
