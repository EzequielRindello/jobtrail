import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

import '../../styles/Filters.css';

// How long to wait after the last key before applying the search, so typing does not send a
// request per letter.
const SEARCH_DELAY_MS = 300;

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  // Read by screen readers, since the field has no visible label.
  label: string;
}

// A search box that shows every key at once but reports the text only after a short pause.
export default function SearchField({ value, onChange, placeholder, label }: SearchFieldProps) {
  const [text, setText] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  const timer = useRef<number | undefined>(undefined);
  const input = useRef<HTMLInputElement>(null);

  // When the value changes from outside (Clear filters, the back button), show it. This is
  // React's "adjust state while rendering" pattern, which avoids an extra effect.
  if (value !== lastValue) {
    setLastValue(value);
    setText(value);
  }

  useEffect(() => {
    return () => window.clearTimeout(timer.current);
  }, []);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    setText(next);

    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onChange(next), SEARCH_DELAY_MS);
  }

  // The X empties the box and applies it at once (no pause), then leaves the cursor in the box.
  function handleClear() {
    window.clearTimeout(timer.current);
    setText('');
    onChange('');
    input.current?.focus();
  }

  return (
    <div className="filter-search">
      <Search size={13} className="filter-search-icon" aria-hidden="true" />
      <input
        ref={input}
        type="search"
        className="filter-control"
        value={text}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={label}
      />
      {text && (
        <button
          type="button"
          className="filter-search-clear"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X size={13} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
