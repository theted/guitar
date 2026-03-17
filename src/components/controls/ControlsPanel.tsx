import React from 'react';
import { X } from 'lucide-react';
import Controls from '@/components/Controls';

interface ControlsPanelProps {
  open: boolean;
  onClose: () => void;
  stopAllPlayback: () => void;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({ open, onClose, stopAllPlayback }) => {
  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 h-full z-50 w-[300px] flex flex-col
          border-l border-white/[0.07] bg-[#080810]/95 backdrop-blur-xl
          transition-transform duration-300 ease-in-out shadow-2xl
          ${open ? 'translate-x-0' : 'translate-x-full'}`}
        aria-label="Settings panel"
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-white/[0.06] flex-shrink-0">
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40">
            Settings
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-all"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <Controls stopAllPlayback={stopAllPlayback} />
        </div>
      </aside>
    </>
  );
};

export default ControlsPanel;
