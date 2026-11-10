// The popup that opens from the toolbar button. Two screens:
// 1. Sign in, when there is no saved session.
// 2. The job found on the current tab, with a button to save it to the board.

import { ApiError, createApplication, login, logout } from './api';
import { WEB_URL } from './config';
import { extractJob, type ExtractedJob } from './extractJob';
import { clearSession, getSession, saveSession, type Session } from './session';

function element<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

const loading = element('loading');
const userName = element('user-name');
const logoutButton = element<HTMLButtonElement>('logout-button');

const loginView = element<HTMLFormElement>('login-view');
const emailInput = element<HTMLInputElement>('email');
const passwordInput = element<HTMLInputElement>('password');
const loginButton = element<HTMLButtonElement>('login-button');
const loginError = element('login-error');

const jobView = element('job-view');
const jobMessage = element('job-message');
const jobPreview = element('job-preview');
const saveButton = element<HTMLButtonElement>('save-button');
const jobError = element('job-error');
const boardLink = element<HTMLAnchorElement>('board-link');

let session: Session | null = null;
let job: ExtractedJob | null = null;

function show(target: HTMLElement, visible: boolean): void {
  target.hidden = !visible;
}

function showError(target: HTMLElement, message: string | null): void {
  target.textContent = message ?? '';
  show(target, message !== null);
}

// ---------- Sign in and log out ----------

function showLogin(): void {
  session = null;
  show(loading, false);
  show(jobView, false);
  show(userName, false);
  show(logoutButton, false);
  show(loginView, true);
  emailInput.focus();
}

loginView.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginButton.disabled = true;
  showError(loginError, null);

  try {
    session = await login(emailInput.value.trim(), passwordInput.value);
    await saveSession(session);
    passwordInput.value = '';
    await showJob();
  } catch (error) {
    showError(loginError, error instanceof ApiError ? error.message : 'Something went wrong.');
  } finally {
    loginButton.disabled = false;
  }
});

logoutButton.addEventListener('click', async () => {
  const token = session?.token;
  await clearSession();
  showLogin();

  // The local session is already gone; this also stops the token from working on the API.
  if (token) {
    await logout(token).catch(() => undefined);
  }
});

// ---------- The job on the current tab ----------

async function showJob(): Promise<void> {
  if (!session) {
    showLogin();
    return;
  }

  show(loading, false);
  show(loginView, false);
  userName.textContent = session.user.displayName;
  show(userName, true);
  show(logoutButton, true);
  show(jobView, true);
  show(jobPreview, false);
  show(boardLink, false);
  showError(jobError, null);
  jobMessage.textContent = 'Reading this page...';
  show(jobMessage, true);

  job = await readJobFromActiveTab();
  if (!job) {
    return;
  }

  element('job-title').textContent = job.title || '(no title)';
  element('job-company').textContent = job.company || '(no company)';
  element('job-location').textContent = job.location ?? '-';
  element('job-salary').textContent = job.salaryRange ?? '-';
  element('job-url').textContent = job.url ? new URL(job.url).hostname : '-';
  element('job-description').textContent = job.description ?? '';
  show(jobMessage, false);
  show(jobPreview, true);

  // The API needs both. Editing the fields before saving comes in a later version.
  const canSave = job.title !== '' && job.company !== '';
  saveButton.disabled = !canSave;
  if (!canSave) {
    showError(jobError, "This page's job data has no title or company, so it can't be saved yet.");
  }
}

// Runs a small function inside the page to read its ld+json scripts. The activeTab
// permission allows it only on the tab where the user clicked the extension.
async function readJobFromActiveTab(): Promise<ExtractedJob | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab?.id === undefined || !tab.url?.startsWith('http')) {
    jobMessage.textContent = 'JobTrail can only read web pages. Open a job post and try again.';
    return null;
  }

  let jsonLdTexts: string[];
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () =>
        Array.from(
          document.querySelectorAll('script[type="application/ld+json"]'),
          (script) => script.textContent ?? '',
        ),
    });
    jsonLdTexts = result?.result ?? [];
  } catch {
    // The browser blocks extensions on some pages (the web store, other extensions).
    jobMessage.textContent = "The browser doesn't let extensions read this page.";
    return null;
  }

  const found = extractJob(jsonLdTexts, tab.url, htmlToText);
  if (!found) {
    jobMessage.textContent = 'This page has no job data that JobTrail can read.';
  }
  return found;
}

saveButton.addEventListener('click', async () => {
  if (!session || !job) {
    return;
  }

  saveButton.disabled = true;
  showError(jobError, null);

  try {
    await createApplication(job, session.token);
    show(jobPreview, false);
    jobMessage.textContent = `Saved "${job.title}" to your board.`;
    show(jobMessage, true);
    boardLink.href = `${WEB_URL}/dashboard`;
    show(boardLink, true);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      // The token expired or was logged out somewhere else: sign in again.
      await clearSession();
      showLogin();
      showError(loginError, 'Your session ended. Sign in again.');
      return;
    }

    showError(jobError, error instanceof ApiError ? error.message : 'Something went wrong.');
    saveButton.disabled = false;
  }
});

// Job descriptions come as HTML. This keeps the text and the line breaks of paragraphs and
// list items. Some sites escape the HTML twice (&lt;p&gt;), so it runs a second time then.
function htmlToText(html: string): string {
  const once = toText(html);
  return /<[a-z][\s\S]*>/i.test(once) ? toText(once) : once;
}

function toText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  doc
    .querySelectorAll('p, div, li, h1, h2, h3, h4, h5, h6, tr')
    .forEach((block) => block.append('\n'));
  doc.querySelectorAll('li').forEach((item) => item.prepend('- '));

  return (doc.body.textContent ?? '')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ---------- Start ----------

session = await getSession();
await showJob();
