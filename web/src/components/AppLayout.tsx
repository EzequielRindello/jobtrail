import { useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';

import { logout } from '../api/authApi';
import { setSessionExpiredHandler } from '../api/client';
import { isLoggedIn as hasSession } from '../utils/authSession';

import '../styles/AppLayout.css';

export default function AppLayout() {
  const navigate = useNavigate();
  useLocation();

  useEffect(() => {
    setSessionExpiredHandler(() => {
      navigate('/login', { replace: true });
    });

    return () => setSessionExpiredHandler(() => {});
  }, [navigate]);

  const isLoggedIn = hasSession();

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch {
      alert('Logout failed. Please try again.');
    }
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left">
          {/* Home is the board when signed in and the login page when not. */}
          <h1 className="app-logo">
            <Link to={isLoggedIn ? '/kanban' : '/login'}>JobTrail</Link>
          </h1>

          <nav className="app-nav">
            <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
              Dashboard
            </Link>
            <Link to="/kanban" className={location.pathname === '/kanban' ? 'active' : ''}>
              Kanban
            </Link>
            <Link to="/skills" className={location.pathname === '/skills' ? 'active' : ''}>
              Skills
            </Link>
          </nav>
        </div>

        <div className="header-right">
          <input
            className="header-search"
            type="search"
            placeholder="Search"
            aria-label="Search"
            disabled
          />

          {isLoggedIn ? (
            <button type="button" className="logout-button" onClick={handleLogout}>
              Log Out
            </button>
          ) : (
            <Link to="/login" className="logout-button login-button">
              Log In
            </Link>
          )}
        </div>
        <nav className="mobile-nav">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/kanban">Kanban</Link>
          <Link to="/skills">Skills</Link>
        </nav>
      </header>

      <main className="app-content">
        <Outlet />
      </main>

      <footer className="app-footer">
        <span>© {new Date().getFullYear()} JobTrail</span>

        <nav className="footer-nav" aria-label="Footer navigation">
          <Link to="/privacy">Privacy</Link>
          <Link to="/policy">Policy</Link>
        </nav>
      </footer>
    </div>
  );
}
