import { apiRequest } from './client';
import type { ApplicationSummary, CreateApplicationRequest } from './applicationTypes';

export async function createApplication(data: CreateApplicationRequest) {
  return apiRequest<ApplicationSummary>('/api/applications', data);
}
