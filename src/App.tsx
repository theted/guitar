import React from 'react';
import Guitar from '@/components/guitar/Guitar';
import Header from '@/components/Header';
import Transport from '@/components/Transport';
import ControlsPanel from '@/components/controls/ControlsPanel';
import { useFormStore } from '@/store';
import { toneAnimationManager } from '@/lib/tone-animation';
import { ensureAudioInitialized, setMasterVolume } from '@/audio';
import { usePlayback } from '@/hooks/usePlayback';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

const App: React.FC = () => {
  const [panelOpen, setPanelOpen] = React.useState(false);

  // Warm up AudioContext on the first user interaction anywhere on the page.
  // This ensures the context is already running (and the pipeline primed) before
  // the user clicks Play — avoiding the "must click a fret first" workaround.
  React.useEffect(() => {
    const warmUp = () => { ensureAudioInitialized().catch(() => {}); };
    document.addEventListener('pointerdown', warmUp, { once: true });
    return () => document.removeEventListener('pointerdown', warmUp);
  }, []);

  // "fret" mode flashes single locations (see usePlayback); the registry mode
  // only matters for pitch-wide flashes
  const flashMode = useFormStore((s) => s.flashMode);
  React.useEffect(() => {
    toneAnimationManager.setMode(flashMode === 'all' ? 'pitch-class' : 'octave-specific');
  }, [flashMode]);

  const volume = useFormStore((s) => s.volume);
  const muted = useFormStore((s) => s.muted);
  React.useEffect(() => {
    setMasterVolume(muted ? 0 : volume / 100);
  }, [volume, muted]);

  const { isPlaying, togglePlay, stopAllPlayback, playNote, events } = usePlayback();

  useKeyboardShortcuts({ togglePlay, stop: stopAllPlayback, panelOpen });

  return (
    <div className="flex h-dvh flex-col">
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full max-w-[1680px] flex-col gap-6 px-4 pb-6 sm:px-6">
          <Header
            stopAllPlayback={stopAllPlayback}
            onOpenSettings={() => setPanelOpen(true)}
          />
          <Guitar onPlayNote={playNote} phraseEvents={events} />
        </div>
      </main>

      <Transport
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        stopAllPlayback={stopAllPlayback}
      />

      <ControlsPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        stopAllPlayback={stopAllPlayback}
      />
    </div>
  );
};

export default App;
