// The form where the user checks, fixes or fills in a job before saving it. It starts from
// what extractJob found on the page, or empty for a manual entry.
//
// This file is pure (no DOM, no chrome APIs), so it is unit-tested in jobForm.test.ts.

import { LIMITS, type ExtractedJob } from './extractJob';

// Every field is text, exactly as the inputs hold it.
export interface JobFormValues {
  title: string;
  company: string;
  location: string;
  salaryRange: string;
  url: string;
  description: string;
}

export type JobFormErrors = Partial<Record<keyof JobFormValues, string>>;

export function emptyForm(): JobFormValues {
  return { title: '', company: '', location: '', salaryRange: '', url: '', description: '' };
}

export function fromJob(job: ExtractedJob): JobFormValues {
  return {
    title: job.title,
    company: job.company,
    location: job.location ?? '',
    salaryRange: job.salaryRange ?? '',
    url: job.url ?? '',
    description: job.description ?? '',
  };
}

// Mirrors the API validation, so the user sees the problem before the request is sent.
export function validateJobForm(values: JobFormValues): JobFormErrors {
  const errors: JobFormErrors = {};

  if (values.title.trim() === '') {
    errors.title = 'Enter the job title.';
  }
  if (values.company.trim() === '') {
    errors.company = 'Enter the company.';
  }

  const url = values.url.trim();
  if (url !== '' && !isHttpUrl(url)) {
    errors.url = 'Enter a full link that starts with http:// or https://.';
  }

  for (const field of Object.keys(LIMITS) as (keyof typeof LIMITS)[]) {
    if (!errors[field] && values[field].trim().length > LIMITS[field]) {
      errors[field] = `Use up to ${LIMITS[field]} characters.`;
    }
  }

  return errors;
}

// The job to send to the API: trimmed, and an empty optional field is left out.
export function toJob(values: JobFormValues): ExtractedJob {
  return {
    title: values.title.trim(),
    company: values.company.trim(),
    location: optional(values.location),
    salaryRange: optional(values.salaryRange),
    url: optional(values.url),
    description: optional(values.description),
  };
}

function optional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}
