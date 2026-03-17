import React from 'react';
import Controls from '@/components/Controls';
import Guitar from '@/components/guitar/Guitar';
import { useFormStore } from '@/store';
import { toneAnimationManager } from '@/lib/tone-animation';
import { scheduler } from '@/scheduler';
import { stopAllAudio } from '@/audio';

const App: React.FC = () => {
  // Playback highlight state lives locally
  const trailLength = useFormStore((s) => s.trailLength);
  const minimalHighlight = useFormStore((s) => s.minimalHighlight);
  const octaveHighlight = useFormStore((s) => s.octaveHighlight);

  // Set default animation mode based on octave highlight setting
  // This is now only used for phrase playback - fretboard clicks are always octave-specific
  React.useEffect(() => {
    toneAnimationManager.setMode(octaveHighlight ? 'octave-specific' : 'pitch-class');
  }, [octaveHighlight]);

  const [playingAbs, setPlayingAbs] = React.useState<number | null>(null);
  const [playingSet, setPlayingSet] = React.useState<number[]>([]);
  const playingTimersRef = React.useRef<Record<number, number>>({});
  const [stopSignal, setStopSignal] = React.useState(0);

  const stopAllPlayback = React.useCallback(() => {
    scheduler.stopAll();
    stopAllAudio();
    Object.values(playingTimersRef.current).forEach((tid) => {
      try { window.clearTimeout(tid); } catch {}
    });
    playingTimersRef.current = {};
    setPlayingSet([]);
    setPlayingAbs(null);

    // Stop tone-based animations
    toneAnimationManager.stopAll();
    setStopSignal((cur) => cur + 1);
  }, []);

  // Unified playback function for both individual notes and phrase playback
  const playNote = (absSemitone: number, durationMs = 200, _source: 'fretboard' | 'phrase' = 'fretboard') => {
    // Handle visual highlighting
    setPlayingAbs(absSemitone);
    setPlayingSet((cur) => (cur.includes(absSemitone) ? cur : [...cur, absSemitone]));
    const trailMs = Math.max(trailLength, durationMs);
    const existing = playingTimersRef.current[absSemitone];
    if (existing) window.clearTimeout(existing);
    
    // Always use octave-specific highlighting for both fretboard clicks and phrase playback
    // This ensures only the specific note being played is highlighted, not all octaves
    toneAnimationManager.flashTone(absSemitone, minimalHighlight ? durationMs : trailMs, 'octave-specific');
    
    // Clean up highlighting after duration
    const tid = window.setTimeout(() => {
      setPlayingSet((cur) => cur.filter((n) => n !== absSemitone));
      if (playingTimersRef.current[absSemitone]) delete playingTimersRef.current[absSemitone];
      setPlayingAbs((cur) => (cur === absSemitone ? null : cur));
    }, minimalHighlight ? durationMs : trailMs);
    playingTimersRef.current[absSemitone] = tid as unknown as number;
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="app-bg" />
      <Controls stopAllPlayback={stopAllPlayback} />
      <main className="fixed inset-0 flex items-center justify-center px-6 pt-[96px]">
        <Guitar
          playingAbs={playingAbs}
          playingSet={playingSet}
          onPlayNote={playNote}
          stopAllPlayback={stopAllPlayback}
          stopSignal={stopSignal}
        />
      </main>
    </div>
  );
};

export default App;

