const TOKEN_KEY = 'token';

// Single place that knows where the session token lives, so the storage can change
// (for example to an httpOnly cookie or a token with an expiry) without touching the callers.
// Storage access can throw (blocked site data, some private windows), so every call is
// guarded: a failed read means "logged out" and a failed write just does not persist.

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Nothing to do: the user will simply have to log in again on the next visit.
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing stored, so nothing to clear.
  }
}

export function isLoggedIn(): boolean {
  return Boolean(getToken());
}
