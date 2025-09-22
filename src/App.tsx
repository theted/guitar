import React from 'react';
import Controls from '@/components/Controls';
import Guitar from '@/components/guitar/Guitar';
import { useFormStore } from '@/store';
import { toneAnimationManager } from '@/lib/tone-animation';

const App: React.FC = () => {
  // Playback highlight state lives locally
  const trailLength = useFormStore((s) => s.trailLength);
  const minimalHighlight = useFormStore((s) => s.minimalHighlight);

  const [playingAbs, setPlayingAbs] = React.useState<number | null>(null);
  const [playingSet, setPlayingSet] = React.useState<number[]>([]);
  const playingTimersRef = React.useRef<Record<number, number>>({});

  const stopAllPlayback = () => {
    Object.values(playingTimersRef.current).forEach((tid) => {
      try { window.clearTimeout(tid); } catch {}
    });
    playingTimersRef.current = {};
    setPlayingSet([]);
    setPlayingAbs(null);
    
    // Stop tone-based animations
    toneAnimationManager.stopAll();
  };

  const flashPlaying = (absSemitone: number, durationMs = 200) => {
    setPlayingAbs(absSemitone);
    setPlayingSet((cur) => (cur.includes(absSemitone) ? cur : [...cur, absSemitone]));
    const trailMs = Math.max(trailLength, durationMs);
    const existing = playingTimersRef.current[absSemitone];
    if (existing) window.clearTimeout(existing);
    
    // Trigger tone-based animation
    toneAnimationManager.flashTone(absSemitone, minimalHighlight ? durationMs : trailMs);
    
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
          onPlayNote={flashPlaying}
          stopAllPlayback={stopAllPlayback}
        />
      </main>
    </div>
  );
};

export default App;

