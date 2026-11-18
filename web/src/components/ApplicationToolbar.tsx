import { useState } from 'react';
import AddApplicationForm from './AddApplicationForm';

import '../styles/Applications.css';

interface ApplicationToolbarProps {
  // Called after an application was saved, so the board can load its list again.
  onCreated?: () => void;
}

// The actions above the board: add an application, and (in later versions) search,
// filter and export. It keeps its own state, so the board only has to place it.
export default function ApplicationToolbar({ onCreated }: ApplicationToolbarProps) {
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');

  function handleCreated() {
    setAdding(false);
    setMessage('Application saved.');
    onCreated?.();
  }

  return (
    <section className="applications-toolbar">
      <div className="applications-toolbar-row">
        <button
          type="button"
          className="applications-primary"
          onClick={() => {
            setMessage('');
            setAdding(true);
          }}
          disabled={adding}
        >
          Add application
        </button>
        {message && (
          <p className="applications-message" role="status">
            {message}
          </p>
        )}
      </div>

      {adding && <AddApplicationForm onCreated={handleCreated} onCancel={() => setAdding(false)} />}
    </section>
  );
}
