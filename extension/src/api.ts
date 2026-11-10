import { API_URL } from './config';
import type { Session } from './session';
import type { ExtractedJob } from './extractJob';

// An error answer from the API. The API sends ProblemDetails JSON: a title, and for
// validation errors (400) the problem of each field under "errors".
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string[]>;

  constructor(status: number, message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface ProblemDetails {
  title?: string;
  errors?: Record<string, string[]>;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, `Can't reach JobTrail at ${API_URL}. Is the API running?`);
  }

  if (!response.ok) {
    const problem = (await response.json().catch(() => ({}))) as ProblemDetails;
    throw new ApiError(response.status, problem.title ?? 'Something went wrong.', problem.errors);
  }

  // 204 No Content (logout) has no body.
  return (response.status === 204 ? undefined : await response.json()) as T;
}

export function login(email: string, password: string): Promise<Session> {
  return request<Session>('POST', '/api/auth/login', { email, password });
}

export function logout(token: string): Promise<void> {
  return request<void>('POST', '/api/auth/logout', undefined, token);
}

export interface CreatedApplication {
  id: string;
  title: string;
  company: string;
}

export function createApplication(job: ExtractedJob, token: string): Promise<CreatedApplication> {
  return request<CreatedApplication>(
    'POST',
    '/api/applications',
    { ...job, stage: 'saved' },
    token,
  );
}
