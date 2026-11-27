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

// Which date the from/to range looks at: when the application was saved or when it was sent.
export const DATE_FIELDS = ['saved', 'applied'] as const;

export type DateField = (typeof DATE_FIELDS)[number];

// What the board filters hold. An empty value means "do not filter". Dates are yyyy-mm-dd,
// the format of <input type="date"> and of the API's from/to.
export interface ApplicationFilterValues {
  search: string;
  stage: ApplicationStage | '';
  dateField: DateField;
  from: string;
  to: string;
}

// One row of an application's stage history. The first row has no fromStage (it was created).
export interface StageChange {
  fromStage: ApplicationStage | null;
  toStage: ApplicationStage;
  changedAt: string;
}

// Everything stored about one application (GET /api/applications/{id}).
export interface ApplicationDetails extends ApplicationSummary {
  url: string | null;
  description: string | null;
  salaryRange: string | null;
  contactName: string | null;
  contactEmail: string | null;
  resumeVersion: string | null;
  notes: string | null;
  // Oldest first.
  history: StageChange[];
}

// The body of PUT /api/applications/{id}. It replaces every field, so a field left out is
// cleared. The stage is not here: it changes only from the board.
export interface SaveApplicationRequest {
  title: string;
  company: string;
  location: string | null;
  url: string | null;
  description: string | null;
  salaryRange: string | null;
  contactName: string | null;
  contactEmail: string | null;
  resumeVersion: string | null;
  notes: string | null;
  appliedOn: string | null;
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
