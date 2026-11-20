import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../api/authApi';
import { isLoggedIn as hasSession } from '../utils/authSession';

import '../styles/AppLayout.css';

export default function AppLayout() {
  const navigate = useNavigate();
  useLocation();

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
          <h1 className="app-logo">JobTrail</h1>

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
            <Link to="/privacy" className={location.pathname === '/privacy' ? 'active' : ''}>
              Privacy
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
          <Link to="/privacy">Privacy</Link>
        </nav>
      </header>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
