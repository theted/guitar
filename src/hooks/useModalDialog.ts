import React from "react";

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Modal behaviour for a dialog that stays mounted while closed: Escape
 * closes it, Tab is trapped inside, and focus moves in on open and back to
 * where it was on close.
 */
export const useModalDialog = (
  dialogRef: React.RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void
) => {
  const restoreFocusRef = React.useRef<HTMLElement | null>(null);

  // Close on Escape, trap Tab inside the dialog
  React.useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      // An open picker inside the dialog closes itself on Escape (and marks
      // the event handled); only an unhandled Escape closes the dialog
      if (e.key === "Escape" && e.defaultPrevented) return;
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => !el.hasAttribute("disabled"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !dialogRef.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [dialogRef, open, onClose]);

  // Move focus into the dialog on open, restore it on close
  React.useEffect(() => {
    if (open) {
      restoreFocusRef.current = document.activeElement as HTMLElement | null;
      const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      firstFocusable?.focus();
    } else {
      restoreFocusRef.current?.focus?.();
      restoreFocusRef.current = null;
    }
  }, [dialogRef, open]);
};
