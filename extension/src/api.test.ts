import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, createApplication, findDuplicates, login, logout } from './api';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

function jsonResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), { status });
}

afterEach(() => {
  fetchMock.mockReset();
});

describe('login', () => {
  it('posts the credentials and returns the session', async () => {
    const session = { token: 't', expiresAt: '2030-01-01T00:00:00Z', user: { id: '1' } };
    fetchMock.mockResolvedValue(jsonResponse(200, session));

    const result = await login('me@example.com', 'Password1!');

    expect(result).toEqual(session);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/auth\/login$/);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ email: 'me@example.com', password: 'Password1!' });
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('throws an ApiError with the API message when the credentials are wrong', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { title: 'Wrong email or password.' }));

    const error = await login('me@example.com', 'bad').catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(error.message).toBe('Wrong email or password.');
  });

  it('explains that the API is unreachable when the request fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const error = await login('me@example.com', 'x').catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(error.message).toContain('Is the API running?');
  });
});

describe('logout', () => {
  it('sends the token and accepts the empty 204 answer', async () => {
    fetchMock.mockResolvedValue(jsonResponse(204));

    await expect(logout('my-token')).resolves.toBeUndefined();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/auth\/logout$/);
    expect(init.headers.Authorization).toBe('Bearer my-token');
  });

  it("sends the device's time zone so the API uses the user's day", async () => {
    fetchMock.mockResolvedValue(jsonResponse(204));

    await logout('my-token');

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers['X-Time-Zone']).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
  });
});

describe('findDuplicates', () => {
  it('sends only the filled fields with the token', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, []));

    await findDuplicates(
      { title: 'Dev', company: '', url: 'https://jobs.example.com/1?a=b' },
      'my-token',
    );

    const [url, init] = fetchMock.mock.calls[0];
    const query = new URL(url).searchParams;
    expect(query.get('url')).toBe('https://jobs.example.com/1?a=b');
    expect(query.get('title')).toBe('Dev');
    expect(query.has('company')).toBe(false);
    expect(init.method).toBe('GET');
    expect(init.headers.Authorization).toBe('Bearer my-token');
  });
});

describe('createApplication', () => {
  it('sends the job in the saved stage with the token', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: '1', title: 'Dev', company: 'Co' }));

    await createApplication({ title: 'Dev', company: 'Co', location: 'Remote' }, 'my-token');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/applications$/);
    expect(init.headers.Authorization).toBe('Bearer my-token');
    expect(JSON.parse(init.body)).toEqual({
      title: 'Dev',
      company: 'Co',
      location: 'Remote',
      stage: 'saved',
    });
  });

  it('exposes the field errors of a 400 answer', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, { title: 'Some fields are not valid.', errors: { url: ['Bad link.'] } }),
    );

    const error = await createApplication({ title: 'Dev', company: 'Co' }, 't').catch((e) => e);

    expect(error.status).toBe(400);
    expect(error.fieldErrors).toEqual({ url: ['Bad link.'] });
  });
});
