import { ListFilter } from 'lucide-react';
import { STAGES, type ApplicationFilterValues, type DateField } from '../api/applicationTypes';
import Dropdown from './filters/Dropdown';
import SearchField from './filters/SearchField';

interface ApplicationFiltersProps {
  values: ApplicationFilterValues;
  onChange: (changes: Partial<ApplicationFilterValues>) => void;
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// The application filters: search and stage always visible, and the date range inside the
// Filter dropdown so it does not take space when it is not used.
export default function ApplicationFilters({ values, onChange }: ApplicationFiltersProps) {
  const activeDates = (values.from !== '' ? 1 : 0) + (values.to !== '' ? 1 : 0);

  return (
    <>
      <Dropdown label="Filter" icon={<ListFilter size={13} />} badge={activeDates}>
        <div className="filter-field">
          <label htmlFor="filter-date-field">Date</label>
          <select
            id="filter-date-field"
            className="filter-control"
            value={values.dateField}
            onChange={(event) => onChange({ dateField: event.target.value as DateField })}
          >
            <option value="saved">Saved on</option>
            <option value="applied">Applied on</option>
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="filter-from">From</label>
          <input
            id="filter-from"
            type="date"
            className="filter-control"
            value={values.from}
            max={values.to || undefined}
            onChange={(event) => onChange({ from: event.target.value })}
          />
        </div>

        <div className="filter-field">
          <label htmlFor="filter-to">To</label>
          <input
            id="filter-to"
            type="date"
            className="filter-control"
            value={values.to}
            min={values.from || undefined}
            onChange={(event) => onChange({ to: event.target.value })}
          />
        </div>
      </Dropdown>

      <select
        className="filter-control"
        aria-label="Stage"
        value={values.stage}
        onChange={(event) =>
          onChange({ stage: event.target.value as ApplicationFilterValues['stage'] })
        }
      >
        <option value="">All stages</option>
        {STAGES.map((stage) => (
          <option key={stage} value={stage}>
            {capitalize(stage)}
          </option>
        ))}
      </select>

      <SearchField
        value={values.search}
        onChange={(search) => onChange({ search })}
        placeholder="Search job title or company"
        label="Search applications"
      />
    </>
  );
}
