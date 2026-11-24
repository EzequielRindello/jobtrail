import { createContext } from 'react';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastOptions {
  kind: ToastKind;
  message: string;
  // An optional button inside the toast (for example "Refresh").
  action?: { label: string; onClick: () => void };
  // A persistent toast stays until the user closes it or clicks its action.
  persistent?: boolean;
  // Showing a toast with the id of one already open replaces it, so it is never shown twice.
  id?: string;
}

export interface ToastContextValue {
  // Shows a toast and returns its id.
  showToast: (options: ToastOptions) => string;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
