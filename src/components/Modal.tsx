import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';

export function Modal({
  open,
  title,
  onClose,
  children,
  actions,
  initialFocusRef,
  closeOnBackdrop = true,
  closeOnEscape = true,
  busy = false,
  className = '',
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
  initialFocusRef?: RefObject<HTMLElement | null>;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  busy?: boolean;
  className?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const pointerStartedOnBackdrop = useRef(false);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    let focusFrame = 0;
    let focusTimer = 0;
    if (open && !element.open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      element.showModal();
      const focusInitialControl = () => {
        const explicit = element.querySelector<HTMLElement>('[data-dialog-initial-focus]');
        const fallback = element.querySelector<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        (initialFocusRef?.current ?? explicit ?? fallback)?.focus({ preventScroll: true });
      };
      focusInitialControl();
      focusFrame = window.requestAnimationFrame(() => {
        focusInitialControl();
        focusTimer = window.setTimeout(focusInitialControl, 0);
      });
    }
    if (!open && element.open) {
      element.close();
      returnFocus.current?.focus();
    }
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.clearTimeout(focusTimer);
    };
  }, [initialFocusRef, open]);
  useEffect(
    () => () => {
      if (dialog.current?.open) dialog.current.close();
      returnFocus.current?.focus();
    },
    [],
  );
  return (
    <dialog
      ref={dialog}
      className={`modal ${className}`.trim()}
      aria-labelledby={titleId}
      aria-busy={busy || undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (closeOnEscape && !busy) onClose();
      }}
      onPointerDown={(event) => {
        pointerStartedOnBackdrop.current = event.target === event.currentTarget;
      }}
      onPointerUp={(event) => {
        if (
          closeOnBackdrop &&
          !busy &&
          pointerStartedOnBackdrop.current &&
          event.target === event.currentTarget
        )
          onClose();
        pointerStartedOnBackdrop.current = false;
      }}
    >
      <div className="modal__header">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className="icon-button"
          aria-label="Close dialog"
          disabled={busy}
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className="modal__body">{children}</div>
      {actions && <div className="modal__actions">{actions}</div>}
    </dialog>
  );
}
