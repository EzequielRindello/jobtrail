import { apiDownload, apiRequest } from './client';
import type {
  ApplicationFilterValues,
  ApplicationSummary,
  CreateApplicationRequest,
  ApplicationStage,
} from './applicationTypes';

// Re-exported so the board components can keep importing the type from here.
export type { ApplicationSummary } from './applicationTypes';

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
  // The date field only matters when there is a range.
  if (filters.from !== '' || filters.to !== '') {
    params.set('dateField', filters.dateField);
  }
  if (filters.from !== '') {
    params.set('from', filters.from);
  }
  if (filters.to !== '') {
    params.set('to', filters.to);
  }

  const query = params.toString();
  return query === '' ? '' : `?${query}`;
}

// All the user's applications, unfiltered (used by the Kanban board).
export async function getApplications(): Promise<ApplicationSummary[]> {
  return apiRequest<ApplicationSummary[]>('/api/applications', undefined, 'GET');
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

// Updates an application stage
export async function changeApplicationStage(
  id: string,
  stage: ApplicationStage,
): Promise<ApplicationSummary> {
  return apiRequest<ApplicationSummary>(`/api/applications/${id}/stage`, { stage }, 'PUT');
}
