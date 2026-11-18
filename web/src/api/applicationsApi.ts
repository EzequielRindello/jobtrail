import { apiRequest } from './client';
import type {
  ApplicationFilterValues,
  ApplicationSummary,
  CreateApplicationRequest,
} from './applicationTypes';

// The query string of GET /api/applications: only the filters that have a value.
export function buildQuery(filters: ApplicationFilterValues): string {
  const params = new URLSearchParams();

  const search = filters.search.trim();
  if (search !== '') {
    params.set('search', search);
  }
  if (filters.stage !== '') {
    params.set('stage', filters.stage);
  }

  const query = params.toString();
  return query === '' ? '' : `?${query}`;
}

export async function searchApplications(filters: ApplicationFilterValues) {
  return apiRequest<ApplicationSummary[]>(
    `/api/applications${buildQuery(filters)}`,
    undefined,
    'GET',
  );
}

export async function createApplication(data: CreateApplicationRequest) {
  return apiRequest<ApplicationSummary>('/api/applications', data);
}
