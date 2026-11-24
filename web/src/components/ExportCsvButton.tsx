import { useState } from 'react';
import { exportApplications } from '../api/applicationsApi';
import type { ApplicationFilterValues } from '../api/applicationTypes';
import { useToast } from '../hooks/useToast';
import { getErrorMessage } from '../utils/errorMessage';

import '../styles/Applications.css';

interface ExportCsvButtonProps {
  // The file has the same applications the filters show.
  filters: ApplicationFilterValues;
}

export default function ExportCsvButton({ filters }: ExportCsvButtonProps) {
  const [exporting, setExporting] = useState(false);
  const { showToast } = useToast();

  async function handleClick() {
    setExporting(true);
    try {
      await exportApplications(filters);
      showToast({ kind: 'success', message: 'CSV downloaded.' });
    } catch (error) {
      showToast({ kind: 'error', message: getErrorMessage(error) });
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      type="button"
      className="applications-text-button"
      onClick={handleClick}
      disabled={exporting}
    >
      {exporting ? 'Exporting...' : 'Export CSV'}
    </button>
  );
}
