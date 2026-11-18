import { useEffect, useState } from 'react';
import { searchApplications } from '../api/applicationsApi';
import type { ApplicationFilterValues } from '../api/applicationTypes';
import AddApplicationForm from './AddApplicationForm';
import ApplicationFilters from './ApplicationFilters';
import ExportCsvButton from './ExportCsvButton';
import Modal from './Modal';

import '../styles/Applications.css';

interface ApplicationToolbarProps {
  // Called after an application was saved, so the board can load its list again.
  onCreated?: () => void;
  // Called when the search box or the stage filter changes, so the board can use the same filters.
  onFiltersChange?: (filters: ApplicationFilterValues) => void;
}

const NO_FILTERS: ApplicationFilterValues = { search: '', stage: '' };

// The actions above the board: add an application, export, search and filter. It keeps its own
// state, so the board only has to place it.
export default function ApplicationToolbar({
  onCreated,
  onFiltersChange,
}: ApplicationToolbarProps) {
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');
  const [filters, setFilters] = useState(NO_FILTERS);
  // Changes after each save, to load the count again.
  const [reloads, setReloads] = useState(0);
  const [count, setCount] = useState<number | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let ignore = false;

    searchApplications(filters)
      .then((applications) => {
        if (!ignore) {
          setCount(applications.length);
          setLoadError('');
        }
      })
      .catch((error) => {
        if (!ignore) {
          setLoadError(error instanceof Error ? error.message : 'Something went wrong');
        }
      });

    // A newer search replaces this one, even if this answer arrives later.
    return () => {
      ignore = true;
    };
  }, [filters, reloads]);

  function handleFiltersChange(next: ApplicationFilterValues) {
    setFilters(next);
    onFiltersChange?.(next);
  }

  function handleCreated() {
    setAdding(false);
    setMessage('Application saved.');
    setReloads((value) => value + 1);
    onCreated?.();
  }

  const filtered = filters.search.trim() !== '' || filters.stage !== '';

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
        <ExportCsvButton filters={filters} />
        {message && (
          <p className="applications-message" role="status">
            {message}
          </p>
        )}
      </div>

      {adding && (
        <Modal title="Add application" onClose={() => setAdding(false)}>
          <AddApplicationForm onCreated={handleCreated} onCancel={() => setAdding(false)} />
        </Modal>
      )}

      <ApplicationFilters onChange={handleFiltersChange} />

      {loadError ? (
        <p className="applications-error" role="alert">
          {loadError}
        </p>
      ) : (
        count !== null && (
          <p className="applications-message" role="status">
            {count === 0
              ? filtered
                ? 'No applications match these filters.'
                : 'No applications yet.'
              : `${count} ${count === 1 ? 'application' : 'applications'}${filtered ? ' match' : ''}`}
          </p>
        )
      )}
    </section>
  );
}
