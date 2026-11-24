import { API_ENDPOINTS, HTTP_STATUS } from './constants';
import { clearToken, getToken } from '../utils/authSession';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';

// Shown when the API is down, unreachable or answers with something that is not the API
// (for example the web dev server's HTML page when VITE_API_BASE_URL is missing).
const SERVER_UNAVAILABLE = 'We could not reach the JobTrail server. Please try again in a moment.';
const SESSION_EXPIRED = 'Your session has expired. Please log in again.';

let onSessionExpired: (() => void) | undefined;

export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
}

// fetch only fails by itself when there is no answer at all (server off, no network).
async function send(endpoint: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(API_URL + endpoint, init);
  } catch {
    throw new Error(SERVER_UNAVAILABLE);
  }
}

function isJson(response: Response): boolean {
  return (response.headers.get('content-type') ?? '').includes('json');
}

// Turns a failed answer into a message a user can read: the API's own message when it sent
// one (validation errors first), otherwise a plain sentence instead of a parser error.
async function toError(response: Response, endpoint: string): Promise<Error> {
  if (response.status === HTTP_STATUS.UNAUTHORIZED && endpoint !== API_ENDPOINTS.LOGIN) {
    clearToken();
    onSessionExpired?.();
    return new Error(SESSION_EXPIRED);
  }

  if (isJson(response)) {
    const error = await response.json().catch(() => ({}));
    const message = Object.values(error.errors || {}).flat()[0] as string | undefined;
    if (message || error.title) {
      return new Error(message || error.title);
    }
  }

  return new Error(SERVER_UNAVAILABLE);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// A GET for a file (the CSV export): returns the body as is instead of parsing JSON.
export async function apiDownload(endpoint: string): Promise<Blob> {
  const response = await send(endpoint, { headers: authHeaders() });

  // An HTML page here means the request did not reach the API, so it is not the file.
  if (!response.ok || (response.headers.get('content-type') ?? '').includes('html')) {
    throw await toError(response, endpoint);
  }

  return response.blob();
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  data?: object,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
): Promise<T> {
  const response = await send(endpoint, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    throw await toError(response, endpoint);
  }

  if (response.status === HTTP_STATUS.NO_CONTENT) {
    return null as T;
  }

  // A 200 that is not JSON did not come from the API.
  if (!isJson(response)) {
    throw new Error(SERVER_UNAVAILABLE);
  }

  return (await response.json()) as T;
}
