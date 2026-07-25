import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useFocusTrap } from "../hooks/useFocusTrap";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Set false for modals holding real in-progress form data (e.g. multi-field create/edit forms) — a stray click outside shouldn't silently discard it. Escape and the explicit close button still work either way. Defaults to true. */
  closeOnBackdropClick?: boolean;
}

/**
 * One dialog component, two responsive presentations: a centered modal on
 * desktop, a bottom sheet on mobile (docs/DESIGN_SYSTEM.md #5). Traps focus
 * on open, restores it on close, and closes on Escape/backdrop click
 * (backdrop click can be turned off — see closeOnBackdropClick).
 */
export function Modal({ open, onClose, title, children, footer, closeOnBackdropClick = true }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement;
    dialogRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="presentation">
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOnBackdropClick ? onClose : undefined}
            aria-hidden="true"
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabIndex={-1}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-lg border border-border bg-surface-raised p-5 shadow-xl sm:max-w-md sm:rounded-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="modal-title" className="font-display text-lg font-semibold">
                {title}
              </h2>
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="rounded-sm p-1 text-text-secondary hover:bg-canvas"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div>{children}</div>
            {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
