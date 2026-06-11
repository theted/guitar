import React from 'react';
import Guitar from '@/components/guitar/Guitar';
import TopBar from '@/components/TopBar';
import ControlsPanel from '@/components/controls/ControlsPanel';
import { useFormStore } from '@/store';
import { toneAnimationManager } from '@/lib/tone-animation';
import { ensureAudioInitialized } from '@/audio';
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

  const octaveHighlight = useFormStore((s) => s.octaveHighlight);
  React.useEffect(() => {
    toneAnimationManager.setMode(octaveHighlight ? 'octave-specific' : 'pitch-class');
  }, [octaveHighlight]);

  const { isPlaying, togglePlay, stopAllPlayback, playNote } = usePlayback();

  useKeyboardShortcuts({ togglePlay, stop: stopAllPlayback, panelOpen });

  return (
    <div className="app-content min-h-screen w-full">
      <div className="app-bg" />

      <TopBar
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        stopAllPlayback={stopAllPlayback}
        onOpenSettings={() => setPanelOpen(true)}
      />

      {/* Guitar — centered when it fits, scrollable when it doesn't */}
      <main className="fixed inset-0 pt-12 overflow-y-auto flex">
        <div className="m-auto w-full flex justify-center px-4 py-6">
          <Guitar onPlayNote={playNote} />
        </div>
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
