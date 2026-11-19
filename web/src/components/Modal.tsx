import { useEffect, useRef } from 'react';

import '../styles/Applications.css';

interface ModalProps {
  // Used by screen readers as the name of the window.
  title: string;
  onClose: () => void;
  // A narrower window, for short forms (one or two fields).
  small?: boolean;
  children: React.ReactNode;
}

// A window over the page, built on the native <dialog>: the browser traps the focus inside it
// and dims the page behind it. It closes only with its X button (not with Esc or a click
// outside). Render it only while it should be open.
export default function Modal({ title, onClose, small, children }: ModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    // The check avoids an error when React runs this effect twice in development.
    if (dialog.current && !dialog.current.open) {
      dialog.current.showModal();
    }
  }, []);

  return (
    <dialog
      ref={dialog}
      className={small ? 'applications-modal applications-modal-small' : 'applications-modal'}
      aria-label={title}
      onClose={onClose}
      // Esc would close it natively; only the X button closes it.
      onCancel={(event) => event.preventDefault()}
    >
      <button
        type="button"
        className="applications-modal-close"
        aria-label="Close"
        onClick={onClose}
      >
        &times;
      </button>
      {children}
    </dialog>
  );
}
