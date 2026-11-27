import { describe, expect, it } from 'vitest';

import type { ApplicationFilterValues } from './applicationTypes';
import { buildQuery } from './applicationsApi';

const NO_FILTERS: ApplicationFilterValues = {
  search: '',
  stage: '',
  dateField: 'saved',
  from: '',
  to: '',
};

describe('buildQuery', () => {
  it('is empty when no filter is set', () => {
    expect(buildQuery(NO_FILTERS)).toBe('');
  });

  it('sends the search without the spaces around it', () => {
    expect(buildQuery({ ...NO_FILTERS, search: '  react dev ' })).toBe('?search=react+dev');
  });

  it('leaves out a search made only of spaces', () => {
    expect(buildQuery({ ...NO_FILTERS, search: '   ' })).toBe('');
  });

  it('sends the stage', () => {
    expect(buildQuery({ ...NO_FILTERS, stage: 'interview' })).toBe('?stage=interview');
  });

  it('sends the date field only together with a date range', () => {
    expect(buildQuery({ ...NO_FILTERS, dateField: 'applied' })).toBe('');
    expect(buildQuery({ ...NO_FILTERS, dateField: 'applied', from: '2026-11-01' })).toBe(
      '?dateField=applied&from=2026-11-01',
    );
  });

  it('sends every filter that has a value', () => {
    expect(
      buildQuery({
        search: 'acme',
        stage: 'applied',
        dateField: 'saved',
        from: '2026-11-01',
        to: '2026-11-30',
      }),
    ).toBe('?search=acme&stage=applied&dateField=saved&from=2026-11-01&to=2026-11-30');
  });
});
