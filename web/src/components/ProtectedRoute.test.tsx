import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { setToken } from '../utils/authSession';
import ProtectedRoute from './ProtectedRoute';

// A private page behind ProtectedRoute and the login page it sends visitors to.
function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/kanban" element={<p>Board page</p>} />
        </Route>
        <Route path="/login" element={<p>Login page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('sends a visitor without a session to the login page', () => {
    renderAt('/kanban');

    expect(screen.getByText('Login page')).toBeTruthy();
    expect(screen.queryByText('Board page')).toBeNull();
  });

  it('sends a visitor with an expired session to the login page', () => {
    setToken('abc', new Date(Date.now() - 1000).toISOString());

    renderAt('/kanban');

    expect(screen.getByText('Login page')).toBeTruthy();
  });

  it('shows the private page to a signed-in user', () => {
    setToken('abc', new Date(Date.now() + 60_000).toISOString());

    renderAt('/kanban');

    expect(screen.getByText('Board page')).toBeTruthy();
  });
});
