import { afterEach, describe, expect, it, vi } from 'vitest';

import { clearToken, getToken, isLoggedIn, setToken } from './authSession';

const HOUR_MS = 60 * 60 * 1000;

function inHours(hours: number) {
  return new Date(Date.now() + hours * HOUR_MS).toISOString();
}

describe('authSession', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('is logged in with a token that has not expired', () => {
    setToken('abc', inHours(1));

    expect(getToken()).toBe('abc');
    expect(isLoggedIn()).toBe(true);
  });

  it('is logged out when the token has expired', () => {
    setToken('abc', inHours(-1));

    expect(isLoggedIn()).toBe(false);
  });

  it('is logged out when the expiry date is missing', () => {
    localStorage.setItem('token', 'abc');

    expect(isLoggedIn()).toBe(false);
  });

  it('forgets the token and its expiry on clear', () => {
    setToken('abc', inHours(1));

    clearToken();

    expect(getToken()).toBeNull();
    expect(localStorage.getItem('expiresAt')).toBeNull();
    expect(isLoggedIn()).toBe(false);
  });

  it('counts blocked storage as logged out instead of crashing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Access denied');
    });

    expect(getToken()).toBeNull();
    expect(isLoggedIn()).toBe(false);
  });
});
