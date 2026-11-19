import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSession, getSession, saveSession, type Session } from './session';

// A minimal in-memory chrome.storage.local.
let store: Record<string, unknown>;

vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: async (key: string) => (key in store ? { [key]: store[key] } : {}),
      set: async (items: Record<string, unknown>) => {
        Object.assign(store, items);
      },
      remove: async (key: string) => {
        delete store[key];
      },
    },
  },
});

const user = { id: '1', email: 'me@example.com', displayName: 'Me' };

function sessionExpiring(expiresAt: string): Session {
  return { token: 'token', expiresAt, user };
}

beforeEach(() => {
  store = {};
});

describe('session', () => {
  it('is empty before signing in', async () => {
    expect(await getSession()).toBeNull();
  });

  it('returns the saved session while the token is valid', async () => {
    const session = sessionExpiring('2999-01-01T00:00:00Z');

    await saveSession(session);

    expect(await getSession()).toEqual(session);
  });

  it('ignores a session whose token has expired', async () => {
    await saveSession(sessionExpiring('2000-01-01T00:00:00Z'));

    expect(await getSession()).toBeNull();
  });

  it('is gone after logging out', async () => {
    await saveSession(sessionExpiring('2999-01-01T00:00:00Z'));

    await clearSession();

    expect(await getSession()).toBeNull();
  });
});
