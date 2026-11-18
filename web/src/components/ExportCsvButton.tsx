import { useState } from 'react';
import { exportApplications } from '../api/applicationsApi';
import type { ApplicationFilterValues } from '../api/applicationTypes';

import '../styles/Applications.css';

interface ExportCsvButtonProps {
  // The file has the same applications the filters show.
  filters: ApplicationFilterValues;
}

export default function ExportCsvButton({ filters }: ExportCsvButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  async function handleClick() {
    setError('');
    setExporting(true);
    try {
      await exportApplications(filters);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="applications-secondary"
        onClick={handleClick}
        disabled={exporting}
      >
        {exporting ? 'Exporting...' : 'Export CSV'}
      </button>
      {error && (
        <p className="applications-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
