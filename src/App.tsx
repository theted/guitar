import React from 'react';
import Guitar from '@/components/guitar/Guitar';
import Header from '@/components/Header';
import Transport from '@/components/Transport';
import ControlsPanel from '@/components/controls/ControlsPanel';
import { useFormStore } from '@/store';
import { toneAnimationManager } from '@/lib/tone-animation';
import { ensureAudioInitialized, setMasterVolume, setReverbLevel, REVERB_LEVELS } from '@/audio';
import { usePlayback } from '@/hooks/usePlayback';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useShareableUrl } from '@/hooks/useShareableUrl';

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

  // The Room setting is the reverb return level, so it reaches tails already ringing
  const reverb = useFormStore((s) => s.reverb);
  React.useEffect(() => {
    setReverbLevel(REVERB_LEVELS[reverb]);
  }, [reverb]);

  const { isPlaying, togglePlay, stopAllPlayback, playNote, events, maxOctaves } = usePlayback();

  useKeyboardShortcuts({ togglePlay, stop: stopAllPlayback, panelOpen });
  useShareableUrl();

  return (
    <div className="flex h-dvh flex-col">
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full max-w-[1680px] flex-col gap-6 px-4 pb-6 sm:px-6">
          <Header onOpenSettings={() => setPanelOpen(true)} />
          {/* The neck sits in the middle of whatever room is left */}
          <div className="flex flex-1 flex-col justify-center">
            <Guitar onPlayNote={playNote} />
          </div>
        </div>
      </main>

      <Transport
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        events={events}
        maxOctaves={maxOctaves}
      />

      <ControlsPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
      />
    </div>
  );
};

export default App;
