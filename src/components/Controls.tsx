import React from 'react';
import ScaleControls from '@/components/controls/ScaleControls';
import InstrumentControls from '@/components/controls/InstrumentControls';
import PlaybackControls from '@/components/controls/PlaybackControls';

type Tab = 'scale' | 'instrument' | 'playback';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'scale', label: 'Scale' },
  { id: 'instrument', label: 'Instrument' },
  { id: 'playback', label: 'Playback' },
];

interface ControlsProps {
  stopAllPlayback: () => void;
}

const Controls: React.FC<ControlsProps> = ({ stopAllPlayback }) => {
  const [activeTab, setActiveTab] = React.useState<Tab>('scale');

  return (
    <div className="flex flex-col min-h-0">
      {/* Tab bar */}
      <div className="flex border-b border-white/[0.06]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] transition-all relative
              ${activeTab === tab.id
                ? 'text-cyan-400'
                : 'text-white/30 hover:text-white/60'
              }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-cyan-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-5">
        {activeTab === 'scale' && <ScaleControls stopAllPlayback={stopAllPlayback} />}
        {activeTab === 'instrument' && <InstrumentControls stopAllPlayback={stopAllPlayback} />}
        {activeTab === 'playback' && <PlaybackControls stopAllPlayback={stopAllPlayback} />}
      </div>
    </div>
  );
};

export default Controls;
