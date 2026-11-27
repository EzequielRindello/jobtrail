import { act, cleanup, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { useUrlFilters } from './useUrlFilters';

// Must be a constant outside the component, as the hook asks.
const DEFAULTS = { search: '', stage: '', sort: 'updated' };

// Renders the hook on a page opened at `url`, and also reports the current query string.
function renderFilters(url = '/kanban') {
  function wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>;
  }

  return renderHook(() => ({ filters: useUrlFilters(DEFAULTS), query: useLocation().search }), {
    wrapper,
  });
}

describe('useUrlFilters', () => {
  afterEach(() => {
    cleanup();
  });

  it('uses the defaults when the URL has no filters', () => {
    const { result } = renderFilters();

    expect(result.current.filters.values).toEqual(DEFAULTS);
    expect(result.current.filters.countActive()).toBe(0);
  });

  it('reads the filters from the URL and ignores unknown keys', () => {
    const { result } = renderFilters('/kanban?search=react&stage=applied&other=1');

    expect(result.current.filters.values).toEqual({
      search: 'react',
      stage: 'applied',
      sort: 'updated',
    });
    expect(result.current.filters.countActive()).toBe(2);
  });

  it('writes a changed filter to the URL and leaves defaults out', () => {
    const { result } = renderFilters();

    act(() => result.current.filters.update({ search: 'acme', sort: 'updated' }));

    expect(result.current.query).toBe('?search=acme');
    expect(result.current.filters.values.search).toBe('acme');
  });

  it('clears only the keys it is given', () => {
    const { result } = renderFilters('/kanban?search=react&stage=applied&sort=company');

    act(() => result.current.filters.clear(['search', 'stage']));

    expect(result.current.query).toBe('?sort=company');
  });
});
