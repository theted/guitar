import React from 'react';
import { X } from 'lucide-react';
import Controls from '@/components/Controls';

interface ControlsPanelProps {
  open: boolean;
  onClose: () => void;
  stopAllPlayback: () => void;
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const ControlsPanel: React.FC<ControlsPanelProps> = ({ open, onClose, stopAllPlayback }) => {
  const panelRef = React.useRef<HTMLElement | null>(null);
  const restoreFocusRef = React.useRef<HTMLElement | null>(null);

  // Close on Escape, trap Tab inside the dialog
  React.useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => !el.hasAttribute('disabled'));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !panelRef.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Move focus into the dialog on open, restore it on close
  React.useEffect(() => {
    if (open) {
      restoreFocusRef.current = document.activeElement as HTMLElement | null;
      const firstFocusable = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      firstFocusable?.focus();
    } else {
      restoreFocusRef.current?.focus?.();
      restoreFocusRef.current = null;
    }
  }, [open]);

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

      {/* Drawer on desktop, bottom sheet on small screens */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        aria-hidden={!open}
        className={`fixed z-50 flex flex-col bg-[#080810]/95 backdrop-blur-xl
          transition-transform duration-300 ease-in-out shadow-2xl
          right-0 top-0 h-full w-[min(300px,88vw)] border-l border-white/[0.07]
          max-sm:inset-x-0 max-sm:top-auto max-sm:bottom-0 max-sm:h-[75vh] max-sm:w-full
          max-sm:border-l-0 max-sm:border-t max-sm:border-white/[0.07] max-sm:rounded-t-2xl
          ${open
            ? 'translate-x-0 max-sm:translate-y-0'
            : 'translate-x-full max-sm:translate-x-0 max-sm:translate-y-full'}`}
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
