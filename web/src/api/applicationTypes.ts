// The five columns of the board, in order. The API sends and expects them in lower case.
export const STAGES = ['saved', 'applied', 'interview', 'offer', 'rejected'] as const;

export type ApplicationStage = (typeof STAGES)[number];

export interface ApplicationSummary {
  id: string;
  title: string;
  company: string;
  location: string | null;
  stage: ApplicationStage;
  appliedOn: string | null;
  createdAt: string;
  updatedAt: string;
}

// What the search box and the stage filter hold. An empty value means "do not filter".
export interface ApplicationFilterValues {
  search: string;
  stage: ApplicationStage | '';
}

// Only title and company are required; the other fields are left out when empty.
export interface CreateApplicationRequest {
  title: string;
  company: string;
  location?: string;
  url?: string;
  salaryRange?: string;
  notes?: string;
  stage?: ApplicationStage;
}
