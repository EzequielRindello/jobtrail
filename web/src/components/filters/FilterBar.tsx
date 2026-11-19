import '../../styles/Filters.css';

interface FilterBarProps {
  // How many filters are active; "Clear filters" only shows when there is at least one.
  activeCount: number;
  onClear: () => void;
  // The page's own fields and dropdowns (search, selects, Filter, Sort).
  children: React.ReactNode;
}

// The row of filters every list page uses, so they all look and behave the same. It sits on the
// right; "Clear filters" goes first so it does not push the other controls around.
export default function FilterBar({ activeCount, onClear, children }: FilterBarProps) {
  return (
    <div className="filter-bar">
      {activeCount > 0 && (
        <button type="button" className="filter-clear" onClick={onClear}>
          Clear filters
        </button>
      )}
      {children}
    </div>
  );
}
