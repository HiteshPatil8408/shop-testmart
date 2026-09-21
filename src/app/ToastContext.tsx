import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface Toast {
  id: number;
  message: string;
  tone: 'success' | 'error' | 'info';
}

const ToastContext = createContext<(message: string, tone?: Toast['tone']) => void>(
  () => undefined,
);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((message: string, tone: Toast['tone'] = 'info') => {
    const id = Date.now();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(
      () => setToasts((current) => current.filter((toast) => toast.id !== id)),
      4500,
    );
  }, []);
  const value = useMemo(() => show, [show]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="toast-stack"
        data-testid="toast-container"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.tone}`} role="status">
            {toast.message}
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
