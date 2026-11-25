import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getToken, setToken } from '../utils/authSession';
import { apiDownload, apiRequest, setSessionExpiredHandler } from './client';

const SERVER_UNAVAILABLE = 'We could not reach the JobTrail server. Please try again in a moment.';
const SESSION_EXPIRED = 'Your session has expired. Please log in again.';

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// The headers of the last request the client sent.
function sentHeaders() {
  const init = fetchMock.mock.calls.at(-1)?.[1];
  return (init?.headers ?? {}) as Record<string, string>;
}

describe('API client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
    localStorage.clear();
    setSessionExpiredHandler(() => {});
  });

  it('sends the token and the device time zone on every request', async () => {
    setToken('abc', new Date(Date.now() + 60_000).toISOString());
    fetchMock.mockResolvedValue(jsonResponse([]));

    await apiRequest('/api/applications', undefined, 'GET');

    expect(sentHeaders().Authorization).toBe('Bearer abc');
    expect(sentHeaders()['X-Time-Zone']).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
  });

  it('returns the parsed JSON of a successful answer', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: '1', title: 'Developer' }));

    await expect(apiRequest('/api/applications/1', undefined, 'GET')).resolves.toEqual({
      id: '1',
      title: 'Developer',
    });
  });

  it('returns null for a 204 answer', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(apiRequest('/api/applications/1', undefined, 'DELETE')).resolves.toBeNull();
  });

  it('ends the session on a 401 and tells the app', async () => {
    const onExpired = vi.fn();
    setSessionExpiredHandler(onExpired);
    setToken('old', new Date(Date.now() + 60_000).toISOString());
    fetchMock.mockResolvedValue(jsonResponse({ title: 'Unauthorized' }, 401));

    await expect(apiRequest('/api/applications', undefined, 'GET')).rejects.toThrow(
      SESSION_EXPIRED,
    );
    expect(getToken()).toBeNull();
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('treats a 401 on login as a wrong password, not an expired session', async () => {
    const onExpired = vi.fn();
    setSessionExpiredHandler(onExpired);
    fetchMock.mockResolvedValue(jsonResponse({ title: 'Invalid email or password.' }, 401));

    await expect(apiRequest('/api/auth/login', { email: 'a@b.co', password: 'x' })).rejects.toThrow(
      'Invalid email or password.',
    );
    expect(onExpired).not.toHaveBeenCalled();
  });

  it('shows the first validation error before the general title', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          title: 'One or more validation errors occurred.',
          errors: { Title: ['Title is required.'] },
        },
        400,
      ),
    );

    await expect(apiRequest('/api/applications', {})).rejects.toThrow('Title is required.');
  });

  it('gives a readable message when the server cannot be reached', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(apiRequest('/api/applications', undefined, 'GET')).rejects.toThrow(
      SERVER_UNAVAILABLE,
    );
  });

  it('gives a readable message when the answer is not from the API', async () => {
    // What the dev server sends back when VITE_API_BASE_URL is missing.
    fetchMock.mockResolvedValue(
      new Response('<!doctype html>', { status: 200, headers: { 'Content-Type': 'text/html' } }),
    );

    await expect(apiRequest('/api/applications', undefined, 'GET')).rejects.toThrow(
      SERVER_UNAVAILABLE,
    );
  });

  it('does not treat an HTML page as the CSV download', async () => {
    fetchMock.mockResolvedValue(
      new Response('<!doctype html>', { status: 200, headers: { 'Content-Type': 'text/html' } }),
    );

    await expect(apiDownload('/api/applications/export')).rejects.toThrow(SERVER_UNAVAILABLE);
  });
});
