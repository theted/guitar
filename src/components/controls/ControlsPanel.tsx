import React from 'react';
import { X } from 'lucide-react';
import SetupControls from './SetupControls';

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
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
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
        aria-labelledby="settings-title"
        aria-hidden={!open}
        inert={!open}
        className={`fixed z-50 flex flex-col bg-bg text-ink
          transition-transform duration-300 ease-out shadow-[0_0_60px_-10px_rgb(0_0_0/0.4)]
          right-0 top-0 h-full w-[min(360px,92vw)] border-l border-line
          max-sm:inset-x-0 max-sm:top-auto max-sm:bottom-0 max-sm:h-[85vh] max-sm:w-full
          max-sm:border-l-0 max-sm:border-t max-sm:rounded-t-2xl
          ${open
            ? 'translate-x-0 max-sm:translate-y-0'
            : 'translate-x-full max-sm:translate-x-0 max-sm:translate-y-full'}`}
      >
        <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-line px-5">
          <h2 id="settings-title" className="type-wide text-base font-bold">Settings</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-md text-ink-2 transition-colors hover:bg-surface hover:text-ink"
            aria-label="Close settings"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <SetupControls stopAllPlayback={stopAllPlayback} />
        </div>
      </aside>
    </>
  );
};

export default ControlsPanel;
