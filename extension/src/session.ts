// The signed-in session lives in chrome.storage.local, so it survives closing the popup and
// restarting the browser: the user signs in once and later saves do not ask again.

export interface Session {
  token: string;
  expiresAt: string;
  user: { id: string; email: string; displayName: string };
}

const SESSION_KEY = 'session';

export async function getSession(): Promise<Session | null> {
  const stored = await chrome.storage.local.get(SESSION_KEY);
  const session = stored[SESSION_KEY] as Session | undefined;

  if (!session || new Date(session.expiresAt) <= new Date()) {
    return null;
  }

  return session;
}

export async function saveSession(session: Session): Promise<void> {
  await chrome.storage.local.set({ [SESSION_KEY]: session });
}

export async function clearSession(): Promise<void> {
  await chrome.storage.local.remove(SESSION_KEY);
}
