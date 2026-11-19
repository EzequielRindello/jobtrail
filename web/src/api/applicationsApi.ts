import { apiRequest } from './client';

export interface ApplicationSummary {
  id: string;
  title: string;
  company: string;
  location: string | null;
  stage: string;
  appliedOn: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getApplications(): Promise<ApplicationSummary[]> {
  return apiRequest<ApplicationSummary[]>('/api/applications', undefined, 'GET');
}
