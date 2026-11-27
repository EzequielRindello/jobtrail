import { X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ToastContext, type ToastKind, type ToastOptions } from './ToastContext';

import '../../styles/Toast.css';

interface Toast extends ToastOptions {
  id: string;
}

// How long a toast stays before closing by itself. Errors stay longer so they can be read.
const DURATION_MS: Record<ToastKind, number> = {
  success: 4000,
  info: 4000,
  error: 6000,
};

let nextId = 0;

// Holds the open toasts and draws them in one corner of the screen, above every page.
export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // The auto-close timer of each toast, so closing or replacing it can cancel the old one.
  const timers = useRef(new Map<string, number>());

  const dismissToast = useCallback((id: string) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (options: ToastOptions) => {
      nextId += 1;
      const id = options.id ?? `toast-${nextId}`;
      const toast: Toast = { ...options, id };

      window.clearTimeout(timers.current.get(id));
      timers.current.delete(id);
      // A toast with the same id is replaced in place; a new one goes at the end.
      setToasts((current) =>
        current.some((item) => item.id === id)
          ? current.map((item) => (item.id === id ? toast : item))
          : [...current, toast],
      );

      if (!options.persistent) {
        timers.current.set(
          id,
          window.setTimeout(() => dismissToast(id), DURATION_MS[options.kind]),
        );
      }

      return id;
    },
    [dismissToast],
  );

  // No timer may fire after the provider is gone.
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="toast-region">
        {toasts.map((toast) => (
          // Errors interrupt the screen reader; the rest wait until it finishes speaking.
          <div
            key={toast.id}
            className={`toast toast-${toast.kind}`}
            role={toast.kind === 'error' ? 'alert' : 'status'}
          >
            <p className="toast-message">{toast.message}</p>

            {toast.action && (
              <button
                type="button"
                className="toast-action"
                onClick={() => {
                  toast.action?.onClick();
                  dismissToast(toast.id);
                }}
              >
                {toast.action.label}
              </button>
            )}

            <button
              type="button"
              className="toast-close"
              aria-label="Close message"
              onClick={() => dismissToast(toast.id)}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
