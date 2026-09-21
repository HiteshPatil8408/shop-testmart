import { useEffect, useRef, type ReactNode } from 'react';

export function Modal({
  open,
  title,
  onClose,
  children,
  actions,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className="modal"
      aria-labelledby="modal-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      <div className="modal__header">
        <h2 id="modal-title">{title}</h2>
        <button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="modal__body">{children}</div>
      {actions && <div className="modal__actions">{actions}</div>}
    </dialog>
  );
}
