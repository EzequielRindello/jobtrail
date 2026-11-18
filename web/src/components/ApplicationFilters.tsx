import { useEffect, useRef, useState } from 'react';
import { STAGES, type ApplicationFilterValues } from '../api/applicationTypes';

import '../styles/Applications.css';

// How long to wait after the last key before asking the API, so typing does not send a request per letter.
const SEARCH_DELAY_MS = 300;

interface ApplicationFiltersProps {
  onChange: (filters: ApplicationFilterValues) => void;
}

export default function ApplicationFilters({ onChange }: ApplicationFiltersProps) {
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState<ApplicationFilterValues['stage']>('');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => window.clearTimeout(timer.current);
  }, []);

  function handleSearch(event: React.ChangeEvent<HTMLInputElement>) {
    const text = event.target.value;
    setSearch(text);

    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onChange({ search: text, stage }), SEARCH_DELAY_MS);
  }

  function handleStage(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value as ApplicationFilterValues['stage'];
    setStage(next);

    // A search typed a moment ago would still fire with the old stage.
    window.clearTimeout(timer.current);
    onChange({ search, stage: next });
  }

  function handleClear() {
    window.clearTimeout(timer.current);
    setSearch('');
    setStage('');
    onChange({ search: '', stage: '' });
  }

  const hasFilters = search.trim() !== '' || stage !== '';

  return (
    <div className="applications-filters">
      <div className="applications-field applications-search">
        <label htmlFor="filter-search">Search</label>
        <input
          id="filter-search"
          type="search"
          value={search}
          onChange={handleSearch}
          placeholder="Job title or company"
        />
      </div>

      <div className="applications-field">
        <label htmlFor="filter-stage">Stage</label>
        <select id="filter-stage" value={stage} onChange={handleStage}>
          <option value="">All stages</option>
          {STAGES.map((value) => (
            <option key={value} value={value}>
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {hasFilters && (
        <button type="button" className="applications-secondary" onClick={handleClear}>
          Clear filters
        </button>
      )}
    </div>
  );
}
