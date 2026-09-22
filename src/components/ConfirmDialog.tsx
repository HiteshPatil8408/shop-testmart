import { useEffect, useState, type ReactNode } from 'react';
import { Modal } from './Modal';

type Phase = 'idle' | 'pending' | 'success' | 'failure';

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  successMessage = 'The action completed successfully.',
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  successMessage?: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!open) {
      setPhase('idle');
      setError('');
    }
  }, [open]);
  const close = () => {
    if (phase !== 'pending') onClose();
  };
  return (
    <Modal
      open={open}
      title={title}
      onClose={close}
      busy={phase === 'pending'}
      closeOnBackdrop={phase !== 'failure'}
      actions={
        phase === 'success' ? (
          <button className="button button--primary" type="button" onClick={close}>
            Done
          </button>
        ) : (
          <>
            <button
              className="button button--secondary"
              type="button"
              disabled={phase === 'pending'}
              onClick={close}
            >
              {cancelLabel}
            </button>
            <button
              className={`button ${destructive ? 'button--danger' : 'button--primary'}`}
              type="button"
              data-dialog-initial-focus
              disabled={phase === 'pending'}
              onClick={async () => {
                setPhase('pending');
                setError('');
                try {
                  await onConfirm();
                  setPhase('success');
                } catch (reason) {
                  setError(
                    reason instanceof Error ? reason.message : 'The action could not be completed.',
                  );
                  setPhase('failure');
                }
              }}
            >
              {phase === 'pending' ? 'Working…' : phase === 'failure' ? 'Try again' : confirmLabel}
            </button>
          </>
        )
      }
    >
      {phase === 'success' ? (
        <p className="alert alert--success" role="status">
          {successMessage}
        </p>
      ) : (
        <>
          {children}
          {error && (
            <p className="alert alert--error" role="alert">
              {error}
            </p>
          )}
        </>
      )}
    </Modal>
  );
}
