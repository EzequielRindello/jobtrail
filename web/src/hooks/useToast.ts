import { useContext } from 'react';
import { ToastContext, type ToastContextValue } from '../components/toast/ToastContext';

// Lets any page show a toast: const { showToast } = useToast();
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used inside ToastProvider.');
  }

  return context;
}
