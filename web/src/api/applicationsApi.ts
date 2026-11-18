import { apiDownload, apiRequest } from './client';
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

// Downloads the applications that match the filters as a CSV file.
export async function exportApplications(filters: ApplicationFilterValues) {
  const file = await apiDownload(`/api/applications/export${buildQuery(filters)}`);

  // The browser only saves a file through a link, so a temporary one is clicked.
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'jobtrail-applications.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export async function createApplication(data: CreateApplicationRequest) {
  return apiRequest<ApplicationSummary>('/api/applications', data);
}
