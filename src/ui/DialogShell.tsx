import { useEffect, useRef, type ReactNode } from 'react';

interface DialogShellProps {
  children: ReactNode;
  className: string;
  labelId: string;
  onClose: () => void;
  closeOnEscape?: boolean;
  role?: 'dialog' | 'alertdialog';
}

const focusableSelector = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export const DialogShell = ({
  children,
  className,
  labelId,
  onClose,
  closeOnEscape = true,
  role = 'dialog',
}: DialogShellProps) => {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);

  closeRef.current = onClose;

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const dialog = dialogRef.current;
    const focusTarget = dialog?.querySelector<HTMLElement>(focusableSelector) ?? dialog;
    window.requestAnimationFrame(() => focusTarget?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        event.preventDefault();
        closeRef.current();
        return;
      }

      if (event.key !== 'Tab' || !closeOnEscape || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      window.requestAnimationFrame(() => previousFocus?.focus());
    };
  }, [closeOnEscape]);

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        ref={dialogRef}
        className={`dialog-shell ${className}`}
        role={role}
        aria-modal="true"
        aria-labelledby={labelId}
        tabIndex={-1}
      >
        {children}
      </section>
    </div>
  );
};
