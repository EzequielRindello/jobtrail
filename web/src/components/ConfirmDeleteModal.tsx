import { useState } from 'react';
import Modal from './Modal';

import '../styles/Applications.css';

interface ConfirmDeleteModalProps {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

// The one confirmation every delete in the app goes through, so nothing is lost with a
// single mis-click. Render it only while the user is being asked.
export default function ConfirmDeleteModal({
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    setBusy(true);
    setError('');
    try {
      await onConfirm();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong');
      setBusy(false);
    }
  }

  return (
    <Modal title={title} small onClose={onCancel}>
      <div className="applications-form">
        <h2>{title}</h2>
        <p className="applications-confirm-message">{message}</p>

        {error && (
          <p className="applications-error" role="alert">
            {error}
          </p>
        )}

        <div className="applications-form-actions">
          <button
            type="button"
            className="applications-secondary"
            onClick={onCancel}
            disabled={busy}
            autoFocus
          >
            Cancel
          </button>
          <button
            type="button"
            className="applications-danger"
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
