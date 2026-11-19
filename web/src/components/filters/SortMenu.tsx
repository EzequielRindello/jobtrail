import { ArrowUpDown, Check } from 'lucide-react';
import Dropdown from './Dropdown';

interface SortMenuProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  alignRight?: boolean;
}

// The Sort dropdown: a list of orders, the current one checked. Choosing one closes it.
export default function SortMenu<T extends string>({
  options,
  value,
  onChange,
  alignRight,
}: SortMenuProps<T>) {
  return (
    <Dropdown label="Sort" icon={<ArrowUpDown size={13} />} alignRight={alignRight}>
      {(close) => (
        <div role="radiogroup" aria-label="Sort by" className="dropdown-options">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={option.value === value}
              className="dropdown-option"
              onClick={() => {
                onChange(option.value);
                close();
              }}
            >
              {option.label}
              {option.value === value && <Check size={13} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </Dropdown>
  );
}
