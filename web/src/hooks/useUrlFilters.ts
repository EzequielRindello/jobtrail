import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

// Keeps a page's filters in the URL query string (?search=react&stage=applied), so they
// survive a reload, the back button and moving between pages. Only values that differ from
// the defaults are written, so a page with no filters has a clean URL.
// `defaults` must be a constant defined outside the component.
export function useUrlFilters<T extends Record<string, string>>(defaults: T) {
  const [params, setParams] = useSearchParams();

  // The params object only changes when the URL does, so `values` is stable between renders
  // and can be used as an effect dependency.
  const values = useMemo(() => {
    const result = { ...defaults };
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const value = params.get(key as string);
      if (value !== null) {
        result[key] = value as T[keyof T];
      }
    }
    return result;
  }, [params, defaults]);

  function update(changes: Partial<T>) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(changes)) {
          if (value === undefined || value === defaults[key]) {
            next.delete(key);
          } else {
            next.set(key, value);
          }
        }
        return next;
      },
      // Typing in a filter should not fill the browser history with one entry per change.
      { replace: true },
    );
  }

  // Puts the given keys (all of them by default) back to their defaults.
  function clear(keys: (keyof T)[] = Object.keys(defaults)) {
    const changes: Partial<T> = {};
    for (const key of keys) {
      changes[key] = defaults[key];
    }
    update(changes);
  }

  // How many of the given keys hold something other than the default (for the badges).
  function countActive(keys: (keyof T)[] = Object.keys(defaults)) {
    return keys.filter((key) => values[key] !== defaults[key]).length;
  }

  return { values, update, clear, countActive };
}
